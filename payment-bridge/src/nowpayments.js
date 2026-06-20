import crypto from 'node:crypto';

export function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  }

  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(',')}}`;
  }

  return JSON.stringify(value);
}

export function isValidIpnSignature(body, signature, secret) {
  if (!signature || !secret) {
    return false;
  }

  const expected = crypto.createHmac('sha512', secret).update(stableStringify(body)).digest('hex');
  const actual = String(signature).trim();

  if (actual.length !== expected.length || !/^[a-f0-9]+$/i.test(actual)) {
    return false;
  }

  return crypto.timingSafeEqual(Buffer.from(actual, 'hex'), Buffer.from(expected, 'hex'));
}

export async function createNowpaymentsInvoice({ config, order }) {
  const response = await fetch(`${config.nowpaymentsApiBase}/invoice`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.nowpaymentsApiKey
    },
    body: JSON.stringify({
      price_amount: order.amountUsd,
      price_currency: 'usd',
      pay_currency: config.rechargeCurrency.toLowerCase(),
      order_id: order.id,
      order_description: `API credits ${order.amountUsd} USDT`,
      ipn_callback_url: `${config.paymentPublicBaseUrl}/payment/ipn`,
      success_url: `${config.paymentPublicBaseUrl}/console/topup?status=success`,
      cancel_url: `${config.paymentPublicBaseUrl}/console/topup?status=cancelled`
    })
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(`NOWPayments invoice failed: ${response.status} ${JSON.stringify(payload)}`);
  }

  return payload;
}
