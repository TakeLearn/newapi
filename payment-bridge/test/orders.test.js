import { describe, expect, it } from 'vitest';
import {
  calculateQuota,
  claimCreditOnce,
  findOrderForIpn,
  isAllowedAmount,
  isFinalPaidStatus,
  markCredited
} from '../src/orders.js';
import { ensurePaymentOrderConstraints, runMigrations } from '../src/migrations.js';
import * as ordersModule from '../src/orders.js';

describe('order policy', () => {
  const config = {
    allowedAmounts: [10, 25, 50, 100],
    newApiQuotaPerUsd: 500000,
    rechargeCreditMultiplier: 1
  };

  it('allows only fixed recharge amounts', () => {
    expect(isAllowedAmount(config, 10)).toBe(true);
    expect(isAllowedAmount(config, 25)).toBe(true);
    expect(isAllowedAmount(config, 11)).toBe(false);
  });

  it('calculates New API quota from USDT amount', () => {
    expect(calculateQuota(config, 10)).toBe(5000000);
    expect(calculateQuota(config, 100)).toBe(50000000);
  });

  it('accepts only final paid statuses', () => {
    expect(isFinalPaidStatus('finished')).toBe(true);
    expect(isFinalPaidStatus('confirmed')).toBe(true);
    expect(isFinalPaidStatus('waiting')).toBe(false);
    expect(isFinalPaidStatus('failed')).toBe(false);
  });

  it('detects conflicting IPN order and payment identifiers', async () => {
    const pool = {
      async query(_sql, params) {
        if (params.orderId === 'order_a') {
          return [[{ id: 'order_a', nowpayments_payment_id: 'payment_a' }]];
        }
        if (params.paymentId === 'payment_b') {
          return [[{ id: 'order_b', nowpayments_payment_id: 'payment_b' }]];
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
    expect(calls[0].sql).toContain("nowpayments_status IN ('finished', 'confirmed')");
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
    expect(queries[0]).toContain('CHECK (quota_to_add > 0)');
    expect(queries[0]).toContain("CHECK (status IN ('pending', 'crediting', 'credited', 'failed', 'expired'))");
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
