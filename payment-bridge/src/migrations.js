const REQUIRED_PAYMENT_ORDER_CONSTRAINTS = [
  'chk_payment_orders_amount_usd',
  'chk_payment_orders_quota_to_add',
  'chk_payment_orders_timestamps',
  'chk_payment_orders_currency',
  'chk_payment_orders_status'
];

export async function runMigrations(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS payment_orders (
      id VARCHAR(64) PRIMARY KEY,
      user_id INT NOT NULL,
      amount_usd INT NOT NULL,
      quota_to_add INT NOT NULL,
      currency VARCHAR(32) NOT NULL,
      status VARCHAR(32) NOT NULL,
      nowpayments_invoice_id VARCHAR(128) NULL,
      nowpayments_payment_id VARCHAR(128) NULL,
      nowpayments_status VARCHAR(64) NULL,
      actually_paid DECIMAL(20, 8) NULL,
      credited_at BIGINT NULL,
      created_at BIGINT NOT NULL,
      updated_at BIGINT NOT NULL,
      UNIQUE KEY uniq_nowpayments_invoice_id (nowpayments_invoice_id),
      UNIQUE KEY uniq_nowpayments_payment_id (nowpayments_payment_id),
      KEY idx_payment_orders_user_id (user_id),
      KEY idx_payment_orders_status (status),
      CONSTRAINT chk_payment_orders_amount_usd CHECK (amount_usd > 0),
      CONSTRAINT chk_payment_orders_quota_to_add CHECK (quota_to_add > 0),
      CONSTRAINT chk_payment_orders_timestamps CHECK (created_at > 0 AND updated_at > 0),
      CONSTRAINT chk_payment_orders_currency CHECK (currency = 'USDTTRC20'),
      CONSTRAINT chk_payment_orders_status CHECK (status IN ('pending', 'crediting', 'credited', 'failed', 'expired'))
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await ensurePaymentOrderConstraints(pool);
}

export async function ensurePaymentOrderConstraints(pool) {
  const [rows] = await pool.query(
    `SELECT CONSTRAINT_NAME
     FROM information_schema.TABLE_CONSTRAINTS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'payment_orders'
       AND CONSTRAINT_TYPE = 'CHECK'`
  );

  const existing = new Set(rows.map((row) => row.CONSTRAINT_NAME));
  const missing = REQUIRED_PAYMENT_ORDER_CONSTRAINTS.filter((name) => !existing.has(name));

  if (missing.length > 0) {
    throw new Error(`payment_orders missing constraints: ${missing.join(', ')}`);
  }
}
