import crypto from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createNowpaymentsInvoice, isValidIpnSignature, stableStringify } from '../src/nowpayments.js';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('NOWPayments IPN signature verification', () => {
  it('accepts a valid HMAC-SHA512 signature over stable JSON', () => {
    const secret = 'test-secret-123456';
    const body = {
      payment_id: 'pay_123',
      order_id: 'ord_123',
      payment_status: 'finished',
      pay_currency: 'usdtbsc',
      actually_paid: 10
    };
    const signature = crypto
      .createHmac('sha512', secret)
      .update(stableStringify(body))
      .digest('hex');

    expect(isValidIpnSignature(body, signature, secret)).toBe(true);
  });

  it('rejects an invalid signature', () => {
    expect(
      isValidIpnSignature({ payment_id: 'pay_123' }, 'bad-signature', 'test-secret-123456')
    ).toBe(false);
  });

  it('rejects a same-length non-hex signature without throwing', () => {
    expect(
      isValidIpnSignature({ payment_id: 'pay_123' }, 'z'.repeat(128), 'test-secret-123456')
    ).toBe(false);
  });
});

describe('NOWPayments invoice creation', () => {
  it('requests a USDT-BSC invoice using the configured recharge currency', async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 'invoice_123',
        invoice_url: 'https://nowpayments.example/invoice_123'
      })
    });
    vi.stubGlobal('fetch', fetch);

    await createNowpaymentsInvoice({
      config: {
        nowpaymentsApiBase: 'https://api.nowpayments.example/v1',
        nowpaymentsApiKey: 'api-key-123',
        paymentPublicBaseUrl: 'https://api.example.com',
        rechargeCurrency: 'USDTBSC'
      },
      order: {
        id: 'order_123',
        amountUsd: 20
      }
    });

    expect(fetch).toHaveBeenCalledWith(
      'https://api.nowpayments.example/v1/invoice',
      expect.objectContaining({
        body: expect.any(String)
      })
    );
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual(
      expect.objectContaining({
        price_amount: 20,
        price_currency: 'usd',
        pay_currency: 'usdtbsc',
        order_id: 'order_123',
        ipn_callback_url: 'https://api.example.com/payment/ipn'
      })
    );
  });
});
