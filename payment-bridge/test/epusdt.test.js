import crypto from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildEpusdtSignature,
  createEpusdtTransaction,
  isValidEpusdtSignature
} from '../src/epusdt.js';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Epusdt signature verification', () => {
  it('builds a GMPay signature from sorted non-empty fields plus merchant secret', () => {
    const payload = {
      trade_id: 'trade_123',
      order_id: 'ep_order_123',
      amount: 1,
      status: 2,
      signature: 'ignored',
      empty: ''
    };

    const expected = crypto
      .createHash('md5')
      .update('amount=1&order_id=ep_order_123&status=2&trade_id=trade_123test-secret-123456')
      .digest('hex');

    expect(buildEpusdtSignature(payload, 'test-secret-123456')).toBe(expected);
  });

  it('accepts a valid callback signature without trusting field order', () => {
    const secret = 'test-secret-123456';
    const callback = {
      order_id: 'ep_order_123',
      amount: 1,
      status: 2,
      trade_id: 'trade_123'
    };
    const signature = buildEpusdtSignature(callback, secret);

    expect(isValidEpusdtSignature({ ...callback, signature }, signature, secret)).toBe(true);
  });

  it('rejects an invalid callback signature', () => {
    expect(
      isValidEpusdtSignature({ order_id: 'ep_order_123', amount: '1.000000' }, 'bad-signature', 'test-secret-123456')
    ).toBe(false);
  });
});

describe('Epusdt transaction creation', () => {
  it('requests a USDT-TRC20 cashier transaction and returns normalized invoice data', async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status_code: 200,
        message: 'success',
        data: {
          trade_id: 'trade_123',
          order_id: 'ep_order_123',
          payment_url: 'https://pay.example.com/usdt/gate/?orderNo=ep_order_123'
        }
      })
    });
    vi.stubGlobal('fetch', fetch);

    const invoice = await createEpusdtTransaction({
      config: {
        epusdtApiBase: 'https://epusdt.example.com',
        epusdtPid: '1000',
        epusdtSecretKey: 'secret-key-123456',
        paymentPublicBaseUrl: 'https://api.example.com'
      },
      order: {
        id: 'local_order_123',
        amountUsd: 1
      }
    });

    expect(fetch).toHaveBeenCalledWith(
      'https://epusdt.example.com/payments/gmpay/v1/order/create-transaction',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
        body: expect.any(String)
      })
    );
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual(
      expect.objectContaining({
        order_id: 'local_order_123',
        pid: '1000',
        currency: 'usd',
        token: 'usdt',
        network: 'tron',
        amount: 1,
        notify_url: 'https://api.example.com/payment/ipn',
        redirect_url: 'https://api.example.com/console/topup?status=success',
        signature: expect.any(String)
      })
    );
    expect(JSON.parse(fetch.mock.calls[0][1].body).signature).toBe(
      buildEpusdtSignature(JSON.parse(fetch.mock.calls[0][1].body), 'secret-key-123456')
    );
    expect(invoice).toEqual({
      id: 'trade_123',
      invoice_url: 'https://pay.example.com/usdt/gate/?orderNo=ep_order_123',
      payment_id: 'ep_order_123',
      raw: expect.objectContaining({
        trade_id: 'trade_123',
        order_id: 'ep_order_123'
      })
    });
  });
});
