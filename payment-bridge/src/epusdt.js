import crypto from 'node:crypto';

function formatAmount(amount) {
  return Number(amount);
}

const PAYMENT_ASSETS = {
  USDTTRC20: { token: 'usdt', network: 'tron' },
  USDTBSC: { token: 'usdt', network: 'binance' }
};

export function resolveEpusdtAsset(currency) {
  const asset = PAYMENT_ASSETS[String(currency || 'USDTTRC20').toUpperCase()];
  if (!asset) {
    throw new Error(`unsupported Epusdt currency: ${currency}`);
  }
  return asset;
}

export function buildEpusdtSignature(payload, secretKey) {
  const base = Object.entries(payload)
    .filter(([key, value]) => key !== 'signature' && value !== undefined && value !== null && value !== '')
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');

  return crypto.createHash('md5').update(`${base}${secretKey}`).digest('hex');
}

export function isValidEpusdtSignature(body, signature, secretKey) {
  if (!signature || !secretKey) {
    return false;
  }

  const expected = buildEpusdtSignature(body, secretKey);
  const actual = String(signature).trim();

  if (actual.length !== expected.length || !/^[a-f0-9]+$/i.test(actual)) {
    return false;
  }

  return crypto.timingSafeEqual(Buffer.from(actual, 'hex'), Buffer.from(expected, 'hex'));
}

export async function createEpusdtTransaction({ config, order }) {
  const asset = resolveEpusdtAsset(order.currency || config.rechargeCurrency);
  const body = {
    currency: 'usd',
    token: asset.token,
    network: asset.network,
    order_id: order.id,
    pid: config.epusdtPid,
    amount: formatAmount(order.amountUsd),
    notify_url: `${config.paymentPublicBaseUrl}/payment/ipn`,
    redirect_url: `${config.paymentPublicBaseUrl}/console/topup?status=success`
  };
  body.signature = buildEpusdtSignature(body, config.epusdtSecretKey);

  const response = await fetch(`${config.epusdtApiBase}/payments/gmpay/v1/order/create-transaction`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok || Number(payload.status_code) !== 200) {
    throw new Error(`Epusdt transaction failed: ${response.status} ${JSON.stringify(payload)}`);
  }

  const data = payload.data || {};
  return {
    id: data.trade_id || data.tradeId || null,
    invoice_url: data.payment_url || data.paymentUrl || data.pay_url || null,
    payment_id: data.order_id || order.id,
    raw: data
  };
}
