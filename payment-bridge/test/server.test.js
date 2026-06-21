import { Readable } from 'node:stream';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { addUserQuota } from '../src/newApiClient.js';
import { createNowpaymentsInvoice, isValidIpnSignature } from '../src/nowpayments.js';
import {
  attachInvoice,
  claimCreditOnce,
  createPendingOrder,
  findOrderForIpn,
  markCredited,
  markIpnObserved,
  releaseCreditClaim
} from '../src/orders.js';
import { createServer } from '../src/server.js';

vi.mock('../src/newApiClient.js', () => ({
  addUserQuota: vi.fn()
}));

vi.mock('../src/nowpayments.js', () => ({
  createNowpaymentsInvoice: vi.fn(),
  isValidIpnSignature: vi.fn()
}));

vi.mock('../src/orders.js', () => ({
  attachInvoice: vi.fn(),
  claimCreditOnce: vi.fn(),
  createPendingOrder: vi.fn(),
  findOrderForIpn: vi.fn(),
  isFinalPaidStatus: vi.fn((status) => ['finished', 'confirmed'].includes(String(status).toLowerCase())),
  markCredited: vi.fn(),
  markIpnObserved: vi.fn(),
  releaseCreditClaim: vi.fn()
}));

function inject(app, { method, path, headers = {}, body }) {
  return new Promise((resolve, reject) => {
    const payload = body === undefined ? '' : JSON.stringify(body);
    const request = Readable.from([payload]);
    request.method = method;
    request.url = path;
    request.headers = {
      host: 'payment-bridge.test',
      'content-type': 'application/json',
      'content-length': Buffer.byteLength(payload),
      ...headers
    };

    const chunks = [];
    const response = {
      statusCode: 200,
      headers: {},
      setHeader(name, value) {
        this.headers[name.toLowerCase()] = value;
      },
      getHeader(name) {
        return this.headers[name.toLowerCase()];
      },
      getHeaders() {
        return this.headers;
      },
      removeHeader(name) {
        delete this.headers[name.toLowerCase()];
      },
      write(chunk) {
        chunks.push(Buffer.from(chunk));
      },
      end(chunk) {
        if (chunk) {
          chunks.push(Buffer.from(chunk));
        }
        const text = Buffer.concat(chunks).toString('utf8');
        resolve({
          status: this.statusCode,
          body: text ? JSON.parse(text) : undefined
        });
      }
    };

    app.handle(request, response, (error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve({
        status: 404,
        body: {}
      });
    });
  });
}

describe('payment bridge server routes', () => {
  const config = {
    nowpaymentsIpnSecret: 'test-ipn-secret-123456',
    rechargeCurrency: 'USDTBSC'
  };
  const pool = { query: vi.fn().mockResolvedValue([{ affectedRows: 1 }]) };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a NOWPayments invoice for a fixed recharge order', async () => {
    createPendingOrder.mockResolvedValue({
      id: 'order_123',
      userId: 42,
      amountUsd: 25,
      quotaToAdd: 12500000,
      currency: 'USDTBSC'
    });
    createNowpaymentsInvoice.mockResolvedValue({
      id: 'invoice_123',
      invoice_url: 'https://nowpayments.example/invoice_123'
    });
    attachInvoice.mockResolvedValue();

    const app = createServer({ config, pool });
    const response = await inject(app, {
      method: 'POST',
      path: '/payment/create',
      body: {
        user_id: '42',
        amount: '25'
      }
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: {
        order_id: 'order_123',
        amount: 25,
        currency: 'USDTBSC',
        invoice_url: 'https://nowpayments.example/invoice_123',
        nowpayments_invoice_id: 'invoice_123'
      }
    });
    expect(createPendingOrder).toHaveBeenCalledWith(pool, config, {
      userId: 42,
      amountUsd: 25
    });
    expect(createNowpaymentsInvoice).toHaveBeenCalledWith({
      config,
      order: expect.objectContaining({ id: 'order_123' })
    });
    expect(attachInvoice).toHaveBeenCalledWith(pool, 'order_123', {
      id: 'invoice_123',
      invoice_url: 'https://nowpayments.example/invoice_123'
    });
  });

  it('returns a generic create error without leaking internals', async () => {
    createPendingOrder.mockRejectedValue(new Error('database password leaked'));

    const app = createServer({ config, pool });
    const response = await inject(app, {
      method: 'POST',
      path: '/payment/create',
      body: {
        user_id: '42',
        amount: '25'
      }
    });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ success: false, message: 'payment creation failed' });
  });

  it('rejects IPN requests with an invalid NOWPayments signature', async () => {
    isValidIpnSignature.mockReturnValue(false);

    const app = createServer({ config, pool });
    const response = await inject(app, {
      method: 'POST',
      path: '/payment/ipn',
      headers: { 'x-nowpayments-sig': 'bad-signature' },
      body: { order_id: 'order_123' }
    });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ success: false, message: 'invalid signature' });
    expect(findOrderForIpn).not.toHaveBeenCalled();
    expect(markIpnObserved).not.toHaveBeenCalled();
  });

  it('credits a final paid IPN once before marking the order credited', async () => {
    isValidIpnSignature.mockReturnValue(true);
    findOrderForIpn.mockResolvedValue({
      id: 'order_123',
      user_id: 42,
      amount_usd: 25,
      quota_to_add: 12500000,
      currency: 'USDTBSC'
    });
    markIpnObserved.mockResolvedValue();
    claimCreditOnce.mockResolvedValue(true);
    addUserQuota.mockResolvedValue({ success: true });
    markCredited.mockResolvedValue(true);

    const app = createServer({ config, pool });
    const response = await inject(app, {
      method: 'POST',
      path: '/payment/ipn',
      headers: { 'x-nowpayments-sig': 'valid-signature' },
      body: {
        order_id: 'order_123',
        payment_status: 'finished',
        pay_currency: 'usdtbsc',
        actually_paid: 25
      }
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true, data: { credited: true } });
    expect(markIpnObserved).toHaveBeenCalledWith(
      pool,
      'order_123',
      expect.objectContaining({ payment_status: 'finished' })
    );
    expect(claimCreditOnce).toHaveBeenCalledWith(pool, 'order_123');
    expect(addUserQuota).toHaveBeenCalledWith({
      config,
      userId: 42,
      quota: 12500000
    });
    expect(markCredited).toHaveBeenCalledWith(pool, 'order_123');
    expect(addUserQuota.mock.invocationCallOrder[0]).toBeLessThan(
      markCredited.mock.invocationCallOrder[0]
    );
  });

  it('validates final paid IPN currency against the stored order currency', async () => {
    isValidIpnSignature.mockReturnValue(true);
    findOrderForIpn.mockResolvedValue({
      id: 'legacy_order_123',
      user_id: 42,
      amount_usd: 25,
      quota_to_add: 12500000,
      currency: 'USDTTRC20'
    });
    markIpnObserved.mockResolvedValue();
    claimCreditOnce.mockResolvedValue(true);
    addUserQuota.mockResolvedValue({ success: true });
    markCredited.mockResolvedValue(true);

    const app = createServer({ config, pool });
    const response = await inject(app, {
      method: 'POST',
      path: '/payment/ipn',
      headers: { 'x-nowpayments-sig': 'valid-signature' },
      body: {
        order_id: 'legacy_order_123',
        payment_status: 'finished',
        pay_currency: 'USDTTRC20',
        actually_paid: 25
      }
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true, data: { credited: true } });
    expect(addUserQuota).toHaveBeenCalledWith({
      config,
      userId: 42,
      quota: 12500000
    });
  });

  it('does not mark credited when New API quota crediting fails', async () => {
    isValidIpnSignature.mockReturnValue(true);
    findOrderForIpn.mockResolvedValue({
      id: 'order_123',
      user_id: 42,
      amount_usd: 25,
      quota_to_add: 12500000
    });
    markIpnObserved.mockResolvedValue();
    claimCreditOnce.mockResolvedValue(true);
    addUserQuota.mockRejectedValue(new Error('New API quota add failed: 502 upstream_error'));
    releaseCreditClaim.mockResolvedValue(true);

    const app = createServer({ config, pool });
    const response = await inject(app, {
      method: 'POST',
      path: '/payment/ipn',
      headers: { 'x-nowpayments-sig': 'valid-signature' },
      body: {
        order_id: 'order_123',
        payment_status: 'finished',
        pay_currency: 'USDTBSC',
        actually_paid: 25
      }
    });

    expect(response.status).toBe(502);
    expect(response.body).toEqual({ success: false, message: 'crediting failed' });
    expect(claimCreditOnce).toHaveBeenCalledWith(pool, 'order_123');
    expect(addUserQuota).toHaveBeenCalledWith({
      config,
      userId: 42,
      quota: 12500000
    });
    expect(releaseCreditClaim).toHaveBeenCalledWith(pool, 'order_123');
    expect(markCredited).not.toHaveBeenCalled();
  });

  it('does not retry New API quota crediting on a repeated IPN after a failed credit claim', async () => {
    isValidIpnSignature.mockReturnValue(true);
    findOrderForIpn.mockResolvedValue({
      id: 'order_123',
      user_id: 42,
      amount_usd: 25,
      quota_to_add: 12500000
    });
    markIpnObserved.mockResolvedValue();
    claimCreditOnce.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    addUserQuota.mockRejectedValue(new Error('New API quota add failed: 502 upstream_error'));
    releaseCreditClaim.mockResolvedValue(true);

    const app = createServer({ config, pool });
    const ipn = {
      order_id: 'order_123',
      payment_status: 'finished',
      pay_currency: 'USDTBSC',
      actually_paid: 25
    };

    const firstResponse = await inject(app, {
      method: 'POST',
      path: '/payment/ipn',
      headers: { 'x-nowpayments-sig': 'valid-signature' },
      body: ipn
    });
    const retryResponse = await inject(app, {
      method: 'POST',
      path: '/payment/ipn',
      headers: { 'x-nowpayments-sig': 'valid-signature' },
      body: ipn
    });

    expect(firstResponse.status).toBe(502);
    expect(firstResponse.body).toEqual({ success: false, message: 'crediting failed' });
    expect(retryResponse.status).toBe(200);
    expect(retryResponse.body).toEqual({ success: true, data: { credited: false } });
    expect(claimCreditOnce).toHaveBeenCalledTimes(2);
    expect(addUserQuota).toHaveBeenCalledTimes(1);
    expect(releaseCreditClaim).toHaveBeenCalledWith(pool, 'order_123');
    expect(markCredited).not.toHaveBeenCalled();
  });

  it('rejects final paid IPNs with malformed paid amount', async () => {
    isValidIpnSignature.mockReturnValue(true);
    findOrderForIpn.mockResolvedValue({
      id: 'order_123',
      user_id: 42,
      amount_usd: 25,
      quota_to_add: 12500000
    });
    markIpnObserved.mockResolvedValue();

    const app = createServer({ config, pool });
    const response = await inject(app, {
      method: 'POST',
      path: '/payment/ipn',
      headers: { 'x-nowpayments-sig': 'valid-signature' },
      body: {
        order_id: 'order_123',
        payment_status: 'finished',
        pay_currency: 'USDTBSC',
        actually_paid: 'not-a-number'
      }
    });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ success: false, message: 'invalid paid amount' });
    expect(claimCreditOnce).not.toHaveBeenCalled();
    expect(addUserQuota).not.toHaveBeenCalled();
  });

  it('reports crediting failure when credited state cannot be persisted', async () => {
    isValidIpnSignature.mockReturnValue(true);
    findOrderForIpn.mockResolvedValue({
      id: 'order_123',
      user_id: 42,
      amount_usd: 25,
      quota_to_add: 12500000
    });
    markIpnObserved.mockResolvedValue();
    claimCreditOnce.mockResolvedValue(true);
    addUserQuota.mockResolvedValue({ success: true });
    markCredited.mockResolvedValue(false);

    const app = createServer({ config, pool });
    const response = await inject(app, {
      method: 'POST',
      path: '/payment/ipn',
      headers: { 'x-nowpayments-sig': 'valid-signature' },
      body: {
        order_id: 'order_123',
        payment_status: 'finished',
        pay_currency: 'USDTBSC',
        actually_paid: 25
      }
    });

    expect(response.status).toBe(502);
    expect(response.body).toEqual({ success: false, message: 'crediting failed' });
  });
});
