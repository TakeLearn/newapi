import crypto from 'node:crypto';

export function isAllowedAmount(config, amount) {
  return Number.isInteger(amount) && config.allowedAmounts.includes(amount);
}

export function calculateQuota(config, amountUsd) {
  return Math.round(amountUsd * config.rechargeCreditMultiplier * config.newApiQuotaPerUsd);
}

export function isFinalPaidStatus(status) {
  return ['finished', 'confirmed'].includes(String(status).toLowerCase());
}

export function createOrderId() {
  return `np_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
}

export async function createPendingOrder(pool, config, { userId, amountUsd }) {
  if (!Number.isInteger(userId) || userId <= 0) {
    throw new Error('userId must be a positive integer');
  }

  if (!isAllowedAmount(config, amountUsd)) {
    throw new Error(`amountUsd must be one of: ${config.allowedAmounts.join(', ')}`);
  }

  const now = Math.floor(Date.now() / 1000);
  const order = {
    id: createOrderId(),
    userId,
    amountUsd,
    quotaToAdd: calculateQuota(config, amountUsd),
    currency: config.rechargeCurrency,
    status: 'pending',
    createdAt: now,
    updatedAt: now
  };

  await pool.query(
    `INSERT INTO payment_orders
      (id, user_id, amount_usd, quota_to_add, currency, status, created_at, updated_at)
     VALUES
      (:id, :userId, :amountUsd, :quotaToAdd, :currency, :status, :createdAt, :updatedAt)`,
    order
  );

  return order;
}

export async function attachInvoice(pool, orderId, invoice) {
  const invoiceId = invoice.id || invoice.invoice_id || null;
  const paymentId = invoice.payment_id || null;
  const now = Math.floor(Date.now() / 1000);

  await pool.query(
    `UPDATE payment_orders
     SET nowpayments_invoice_id = :invoiceId,
         nowpayments_payment_id = :paymentId,
         updated_at = :now
     WHERE id = :orderId`,
    { orderId, invoiceId, paymentId, now }
  );
}

export async function findOrderForIpn(pool, ipn) {
  const orderId = ipn.order_id;
  const paymentId = ipn.payment_id ? String(ipn.payment_id) : null;

  const [orderRows] = await pool.query('SELECT * FROM payment_orders WHERE id = :orderId LIMIT 1', {
    orderId
  });
  const orderMatch = orderRows[0] || null;

  let paymentMatch = null;
  if (paymentId) {
    const [paymentRows] = await pool.query(
      `SELECT * FROM payment_orders
       WHERE nowpayments_payment_id IS NOT NULL
         AND nowpayments_payment_id = :paymentId
       LIMIT 1`,
      { paymentId }
    );
    paymentMatch = paymentRows[0] || null;
  }

  if (orderMatch && paymentMatch && orderMatch.id !== paymentMatch.id) {
    throw new Error('IPN order_id and payment_id point to different orders');
  }

  return orderMatch || paymentMatch;
}

export async function markIpnObserved(pool, orderId, ipn) {
  const now = Math.floor(Date.now() / 1000);
  await pool.query(
    `UPDATE payment_orders
     SET nowpayments_payment_id = COALESCE(nowpayments_payment_id, :paymentId),
         nowpayments_status = :paymentStatus,
         actually_paid = :actuallyPaid,
         updated_at = :now
     WHERE id = :orderId`,
    {
      orderId,
      paymentId: ipn.payment_id ? String(ipn.payment_id) : null,
      paymentStatus: ipn.payment_status || null,
      actuallyPaid: ipn.actually_paid || null,
      now
    }
  );
}

export async function claimCreditOnce(pool, orderId) {
  const now = Math.floor(Date.now() / 1000);
  const [result] = await pool.query(
    `UPDATE payment_orders
     SET status = 'crediting',
         updated_at = :now
     WHERE id = :orderId
       AND credited_at IS NULL
       AND status = 'pending'
       AND nowpayments_status IN ('finished', 'confirmed')`,
    { orderId, now }
  );

  return result.affectedRows === 1;
}

export async function markCredited(pool, orderId) {
  const now = Math.floor(Date.now() / 1000);
  const [result] = await pool.query(
    `UPDATE payment_orders
     SET status = 'credited',
         credited_at = :now,
         updated_at = :now
     WHERE id = :orderId
       AND credited_at IS NULL
       AND status = 'crediting'`,
    { orderId, now }
  );

  return result.affectedRows === 1;
}
