import crypto from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { isValidIpnSignature, stableStringify } from '../src/nowpayments.js';

describe('NOWPayments IPN signature verification', () => {
  it('accepts a valid HMAC-SHA512 signature over stable JSON', () => {
    const secret = 'test-secret-123456';
    const body = {
      payment_id: 'pay_123',
      order_id: 'ord_123',
      payment_status: 'finished',
      pay_currency: 'usdttrc20',
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
