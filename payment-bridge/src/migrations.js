const REQUIRED_PAYMENT_ORDER_CONSTRAINTS = [
  'chk_payment_orders_amount_usd',
  'chk_payment_orders_quota_to_add',
  'chk_payment_orders_timestamps',
  'chk_payment_orders_currency',
  'chk_payment_orders_status'
];

const PAYMENT_ORDER_CURRENCY_CHECK =
  "CHECK (currency IN ('USDTBSC', 'USDTTRC20'))";

export async function runMigrations(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS payment_orders (
      id VARCHAR(64) PRIMARY KEY,
      user_id INT NOT NULL,
      amount_usd INT NOT NULL,
      quota_to_add INT NOT NULL,
      currency VARCHAR(32) NOT NULL,
      status VARCHAR(32) NOT NULL,
      provider VARCHAR(32) NOT NULL DEFAULT 'epusdt',
      provider_invoice_id VARCHAR(128) NULL,
      provider_payment_id VARCHAR(128) NULL,
      provider_status VARCHAR(64) NULL,
      nowpayments_invoice_id VARCHAR(128) NULL,
      nowpayments_payment_id VARCHAR(128) NULL,
      nowpayments_status VARCHAR(64) NULL,
      actually_paid DECIMAL(20, 8) NULL,
      credited_at BIGINT NULL,
      created_at BIGINT NOT NULL,
      updated_at BIGINT NOT NULL,
      UNIQUE KEY uniq_nowpayments_invoice_id (nowpayments_invoice_id),
      UNIQUE KEY uniq_nowpayments_payment_id (nowpayments_payment_id),
      UNIQUE KEY uniq_provider_invoice_id (provider_invoice_id),
      UNIQUE KEY uniq_provider_payment_id (provider_payment_id),
      KEY idx_payment_orders_user_id (user_id),
      KEY idx_payment_orders_status (status),
      CONSTRAINT chk_payment_orders_amount_usd CHECK (amount_usd > 0),
      CONSTRAINT chk_payment_orders_quota_to_add CHECK (quota_to_add > 0),
      CONSTRAINT chk_payment_orders_timestamps CHECK (created_at > 0 AND updated_at > 0),
      CONSTRAINT chk_payment_orders_currency ${PAYMENT_ORDER_CURRENCY_CHECK},
      CONSTRAINT chk_payment_orders_status CHECK (status IN ('pending', 'crediting', 'credited', 'failed', 'expired'))
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await ensureProviderColumns(pool);
  await ensurePaymentOrderCurrencyConstraint(pool);
  await ensurePaymentOrderConstraints(pool);
}

async function ensureProviderColumns(pool) {
  const [rows = []] = await pool.query(
    `SELECT COLUMN_NAME
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'payment_orders'
       AND COLUMN_NAME IN ('provider', 'provider_invoice_id', 'provider_payment_id', 'provider_status')`
  );
  const existing = new Set(rows.map((row) => row.COLUMN_NAME));

  const statements = [
    [
      'provider',
      "ALTER TABLE payment_orders ADD COLUMN provider VARCHAR(32) NOT NULL DEFAULT 'epusdt' AFTER status"
    ],
    [
      'provider_invoice_id',
      'ALTER TABLE payment_orders ADD COLUMN provider_invoice_id VARCHAR(128) NULL AFTER provider'
    ],
    [
      'provider_payment_id',
      'ALTER TABLE payment_orders ADD COLUMN provider_payment_id VARCHAR(128) NULL AFTER provider_invoice_id'
    ],
    [
      'provider_status',
      'ALTER TABLE payment_orders ADD COLUMN provider_status VARCHAR(64) NULL AFTER provider_payment_id'
    ]
  ];

  for (const [column, sql] of statements) {
    if (!existing.has(column)) {
      await pool.query(sql);
    }
  }
}

async function ensurePaymentOrderCurrencyConstraint(pool) {
  const [rows = []] = await pool.query(
    `SELECT CHECK_CLAUSE
     FROM information_schema.CHECK_CONSTRAINTS
     WHERE CONSTRAINT_SCHEMA = DATABASE()
       AND CONSTRAINT_NAME = 'chk_payment_orders_currency'
     LIMIT 1`
  );

  const currentClause = String(rows[0]?.CHECK_CLAUSE || '').toUpperCase();
  if (!currentClause) {
    return;
  }
  if (currentClause.includes('USDTBSC') && currentClause.includes('USDTTRC20')) {
    return;
  }

  await pool.query('ALTER TABLE payment_orders DROP CHECK chk_payment_orders_currency');
  await pool.query(
    `ALTER TABLE payment_orders ADD CONSTRAINT chk_payment_orders_currency ${PAYMENT_ORDER_CURRENCY_CHECK}`
  );
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
