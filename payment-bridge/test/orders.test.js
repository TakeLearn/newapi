import { describe, expect, it } from 'vitest';
import {
  attachInvoice,
  calculateQuota,
  claimCreditOnce,
  findOrderForIpn,
  isAllowedAmount,
  isFinalPaidStatus,
  markCredited,
  createOrderId,
  releaseCreditClaim
} from '../src/orders.js';
import { ensurePaymentOrderConstraints, runMigrations } from '../src/migrations.js';
import * as ordersModule from '../src/orders.js';

describe('order policy', () => {
  const config = {
    allowedAmounts: [20, 30, 50, 100],
    newApiQuotaPerUsd: 500000,
    rechargeCreditMultiplier: 1
  };

  it('allows only fixed recharge amounts', () => {
    expect(isAllowedAmount(config, 10)).toBe(false);
    expect(isAllowedAmount(config, 11)).toBe(false);
    expect(isAllowedAmount(config, 20)).toBe(true);
    expect(isAllowedAmount(config, 25)).toBe(false);
    expect(isAllowedAmount(config, 30)).toBe(true);
  });

  it('calculates New API quota from USDT amount', () => {
    expect(calculateQuota(config, 20)).toBe(10000000);
    expect(calculateQuota(config, 100)).toBe(50000000);
  });

  it('accepts only final paid statuses', () => {
    expect(isFinalPaidStatus(2)).toBe(true);
    expect(isFinalPaidStatus('success')).toBe(true);
    expect(isFinalPaidStatus('finished')).toBe(true);
    expect(isFinalPaidStatus('confirmed')).toBe(true);
    expect(isFinalPaidStatus('waiting')).toBe(false);
    expect(isFinalPaidStatus('failed')).toBe(false);
  });

  it('creates GMPay-compatible compact order IDs', () => {
    const id = createOrderId();

    expect(id).toMatch(/^np[a-z0-9]+$/);
    expect(id.length).toBeLessThanOrEqual(22);
  });

  it('attaches provider-neutral invoice identifiers while preserving legacy columns', async () => {
    const calls = [];
    const pool = {
      async query(sql, params) {
        calls.push({ sql, params });
      }
    };

    await attachInvoice(pool, 'order_a', {
      id: 'trade_123',
      payment_id: 'ep_order_123',
      invoice_url: 'https://epusdt.example/gate/ep_order_123'
    });

    expect(calls[0].sql).toContain('provider_invoice_id = :invoiceId');
    expect(calls[0].sql).toContain('provider_payment_id = :paymentId');
    expect(calls[0].sql).toContain('nowpayments_invoice_id = COALESCE(nowpayments_invoice_id, :invoiceId)');
    expect(calls[0].params).toEqual(
      expect.objectContaining({
        orderId: 'order_a',
        invoiceId: 'trade_123',
        paymentId: 'ep_order_123'
      })
    );
  });

  it('detects conflicting IPN order and provider payment identifiers', async () => {
    const pool = {
      async query(_sql, params) {
        if (params.orderId === 'order_a') {
          return [[{ id: 'order_a', provider_payment_id: 'payment_a' }]];
        }
        if (params.paymentId === 'payment_b') {
          return [[{ id: 'order_b', provider_payment_id: 'payment_b' }]];
        }
        return [[]];
      }
    };

    await expect(
      findOrderForIpn(pool, { order_id: 'order_a', payment_id: 'payment_b' })
    ).rejects.toThrow('different orders');
  });

  it('claims credit only from a final paid pending order', async () => {
    const calls = [];
    const pool = {
      async query(sql, params) {
        calls.push({ sql, params });
        return [{ affectedRows: 1 }];
      }
    };

    await expect(claimCreditOnce(pool, 'order_a')).resolves.toBe(true);
    expect(calls[0].sql).toContain("status = 'pending'");
    expect(calls[0].sql).toContain("provider_status IN ('2', 'success', 'finished', 'confirmed')");
    expect(calls[0].sql).toContain("nowpayments_status IN ('2', 'success', 'finished', 'confirmed')");
  });

  it('marks credited only after an order is in crediting state', async () => {
    const calls = [];
    const pool = {
      async query(sql, params) {
        calls.push({ sql, params });
        return [{ affectedRows: 1 }];
      }
    };

    await expect(markCredited(pool, 'order_a')).resolves.toBe(true);
    expect(calls[0].sql).toContain("status = 'crediting'");
    expect(calls[0].sql).toContain('credited_at IS NULL');
  });

  it('releases a credit claim to failed so automatic retries cannot reclaim it', async () => {
    const calls = [];
    const pool = {
      async query(sql, params) {
        calls.push({ sql, params });
        return [{ affectedRows: 1 }];
      }
    };

    await expect(releaseCreditClaim(pool, 'order_a')).resolves.toBe(true);
    expect(calls[0].sql).toContain("SET status = 'failed'");
    expect(calls[0].sql).not.toContain("SET status = 'pending'");
    expect(calls[0].sql).toContain("status = 'crediting'");
    expect(calls[0].sql).toContain('credited_at IS NULL');
  });

  it('does not export the old ambiguous markCreditedOnce helper', () => {
    expect(ordersModule.markCreditedOnce).toBeUndefined();
  });

  it('creates payment_orders with money and status constraints', async () => {
    const queries = [];
    const pool = {
      async query(sql) {
        queries.push(sql);
        if (sql.includes('information_schema.TABLE_CONSTRAINTS')) {
          return [
            [
              { CONSTRAINT_NAME: 'chk_payment_orders_amount_usd' },
              { CONSTRAINT_NAME: 'chk_payment_orders_quota_to_add' },
              { CONSTRAINT_NAME: 'chk_payment_orders_timestamps' },
              { CONSTRAINT_NAME: 'chk_payment_orders_currency' },
              { CONSTRAINT_NAME: 'chk_payment_orders_status' }
            ]
          ];
        }
        return [];
      }
    };

    await runMigrations(pool);
    expect(queries[0]).toContain('CHECK (amount_usd > 0)');
    expect(queries[0]).toContain('provider VARCHAR(32) NOT NULL DEFAULT');
    expect(queries[0]).toContain('provider_invoice_id VARCHAR(128) NULL');
    expect(queries[0]).toContain('provider_payment_id VARCHAR(128) NULL');
    expect(queries[0]).toContain('provider_status VARCHAR(64) NULL');
    expect(queries[0]).toContain('CHECK (quota_to_add > 0)');
    expect(queries[0]).toContain("CHECK (currency IN ('USDTBSC', 'USDTTRC20'))");
    expect(queries[0]).toContain("CHECK (status IN ('pending', 'crediting', 'credited', 'failed', 'expired'))");
  });

  it('adds provider-neutral columns to existing payment_orders tables', async () => {
    const queries = [];
    const pool = {
      async query(sql) {
        queries.push(sql);
        if (sql.includes('information_schema.TABLE_CONSTRAINTS')) {
          return [
            [
              { CONSTRAINT_NAME: 'chk_payment_orders_amount_usd' },
              { CONSTRAINT_NAME: 'chk_payment_orders_quota_to_add' },
              { CONSTRAINT_NAME: 'chk_payment_orders_timestamps' },
              { CONSTRAINT_NAME: 'chk_payment_orders_currency' },
              { CONSTRAINT_NAME: 'chk_payment_orders_status' }
            ]
          ];
        }
        if (sql.includes('information_schema.CHECK_CONSTRAINTS')) {
          return [[{ CHECK_CLAUSE: "`currency` in ('USDTBSC','USDTTRC20')" }]];
        }
        if (sql.includes('information_schema.COLUMNS')) {
          return [[]];
        }
        return [];
      }
    };

    await runMigrations(pool);

    expect(queries).toContain(
      "ALTER TABLE payment_orders ADD COLUMN provider VARCHAR(32) NOT NULL DEFAULT 'epusdt' AFTER status"
    );
    expect(queries).toContain(
      'ALTER TABLE payment_orders ADD COLUMN provider_invoice_id VARCHAR(128) NULL AFTER provider'
    );
    expect(queries).toContain(
      'ALTER TABLE payment_orders ADD COLUMN provider_payment_id VARCHAR(128) NULL AFTER provider_invoice_id'
    );
    expect(queries).toContain(
      'ALTER TABLE payment_orders ADD COLUMN provider_status VARCHAR(64) NULL AFTER provider_payment_id'
    );
  });

  it('updates the legacy TRC20-only currency constraint in existing deployments', async () => {
    const queries = [];
    const pool = {
      async query(sql) {
        queries.push(sql);
        if (sql.includes('information_schema.TABLE_CONSTRAINTS')) {
          return [
            [
              { CONSTRAINT_NAME: 'chk_payment_orders_amount_usd' },
              { CONSTRAINT_NAME: 'chk_payment_orders_quota_to_add' },
              { CONSTRAINT_NAME: 'chk_payment_orders_timestamps' },
              { CONSTRAINT_NAME: 'chk_payment_orders_currency' },
              { CONSTRAINT_NAME: 'chk_payment_orders_status' }
            ]
          ];
        }
        if (sql.includes('information_schema.CHECK_CONSTRAINTS')) {
          return [[{ CHECK_CLAUSE: "`currency` = 'USDTTRC20'" }]];
        }
        return [];
      }
    };

    await runMigrations(pool);
    expect(queries).toContain('ALTER TABLE payment_orders DROP CHECK chk_payment_orders_currency');
    expect(queries).toContain(
      "ALTER TABLE payment_orders ADD CONSTRAINT chk_payment_orders_currency CHECK (currency IN ('USDTBSC', 'USDTTRC20'))"
    );
  });

  it('verifies required migration constraints after table creation', async () => {
    const pool = {
      async query() {
        return [
          [
            { CONSTRAINT_NAME: 'chk_payment_orders_amount_usd' },
            { CONSTRAINT_NAME: 'chk_payment_orders_quota_to_add' },
            { CONSTRAINT_NAME: 'chk_payment_orders_timestamps' },
            { CONSTRAINT_NAME: 'chk_payment_orders_currency' },
            { CONSTRAINT_NAME: 'chk_payment_orders_status' }
          ]
        ];
      }
    };

    await expect(ensurePaymentOrderConstraints(pool)).resolves.toBeUndefined();
  });

  it('fails migration verification when required constraints are missing', async () => {
    const pool = {
      async query() {
        return [[{ CONSTRAINT_NAME: 'chk_payment_orders_amount_usd' }]];
      }
    };

    await expect(ensurePaymentOrderConstraints(pool)).rejects.toThrow('missing constraints');
  });
});
