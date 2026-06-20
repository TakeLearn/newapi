# New API Commercial MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deploy a New API based commercial MVP where users can pay USDT-TRC20 through NOWPayments, receive credits automatically, create API keys, and call DeepSeek, Kimi/Moonshot, OpenAI, and Anthropic Claude API.

**Architecture:** Use New API as the main gateway and admin console. Run New API, MySQL, Redis, Caddy, and a small Node.js payment bridge on one Hetzner Singapore VPS using Docker Compose. The payment bridge owns NOWPayments orders and IPN verification, then credits New API users through the New API admin user management API.

**Tech Stack:** Mac Docker Desktop for local validation, Tencent Cloud Lighthouse for staging, Hetzner Cloud Singapore for production, Ubuntu 24.04 LTS, Docker Compose, New API (`calciumion/new-api` pinned to a validated tag or digest before production), MySQL 8, Redis 7, Caddy 2, Node.js 22, Express, mysql2, Zod, Vitest, NOWPayments API.

---

## File Structure

- Create: `.gitignore`
  - Ignore secrets, runtime data, logs, Node dependencies, and local environment files.
- Create: `deploy/.env.example`
  - Safe template for production environment variables.
- Create: `deploy/docker-compose.yml`
  - Single-node deployment for New API, MySQL, Redis, Caddy, and the payment bridge.
- Create: `deploy/Caddyfile`
  - HTTPS reverse proxy for New API and payment bridge routes.
- Create: `deploy/README.md`
  - Server setup, deployment, backup, provider configuration, and operational verification commands.
- Create: `payment-bridge/package.json`
  - Node project scripts and dependencies.
- Create: `payment-bridge/src/config.js`
  - Environment parsing and startup safety checks.
- Create: `payment-bridge/src/db.js`
  - MySQL pool and migration runner.
- Create: `payment-bridge/src/migrations.js`
  - `payment_orders` table creation.
- Create: `payment-bridge/src/nowpayments.js`
  - NOWPayments invoice creation and IPN signature verification.
- Create: `payment-bridge/src/newApiClient.js`
  - Calls New API admin management API to add user quota.
- Create: `payment-bridge/src/orders.js`
  - Order creation, lookup, state transitions, and idempotent credit marking.
- Create: `payment-bridge/src/server.js`
  - Express routes for creating recharge invoices, receiving IPN, and health checks.
- Create: `payment-bridge/src/index.js`
  - Entrypoint that runs migrations and starts the server.
- Create: `payment-bridge/test/nowpayments.test.js`
  - Tests IPN signature verification and rejection.
- Create: `payment-bridge/test/orders.test.js`
  - Tests fixed recharge amounts and duplicate webhook idempotency.
- Create: `payment-bridge/Dockerfile`
  - Production container for the payment bridge.
- Create: `scripts/verify-mvp.sh`
  - Local or server-side smoke checks for HTTPS, New API status, bridge health, and containers.
- Create: `docs/operations/stage-1-runbook.md`
  - Manual runbook for first production launch and incident handling.

## Key Implementation Decisions

- Credits use New API quota units. New API uses `common.QuotaPerUnit` internally; the payment bridge will expose `NEW_API_QUOTA_PER_USD` with default `500000`. If the deployed New API settings use a different quota-per-dollar display, update this variable before accepting payment.
- The payment bridge will credit via `POST /api/user/manage` with a body shaped like `{"id": 123, "action": "add_quota", "mode": "add", "value": 5000000}` using a dedicated New API admin access token.
- The bridge stores its own `payment_orders` records. It does not write New API internal `top_ups` rows in Stage 1.
- NOWPayments IPN signature secret must be non-empty. The bridge must refuse to start if `NOWPAYMENTS_IPN_SECRET` is empty.
- Only fixed amounts `10`, `25`, `50`, and `100` are accepted.
- Only USDT-TRC20 is accepted.
- Rollout is local Mac first, Tencent Cloud Lighthouse staging second, and Hetzner Singapore production last.
- `calciumion/new-api:latest` can be used only during initial local discovery. Before staging acceptance, replace `NEW_API_IMAGE` with a validated tag or digest such as `calciumion/new-api@sha256:$NEW_API_IMAGE_DIGEST`.

## Task 1: Initialize Repository Hygiene

**Files:**
- Create: `.gitignore`

- [ ] **Step 1: Create ignore rules**

Create `.gitignore`:

```gitignore
# Secrets and local env files
.env
.env.*
!.env.example
deploy/.env
deploy/.env.local
deploy/.env.staging
deploy/.env.production

# Runtime data
deploy/data/
deploy/logs/
deploy/mysql/
deploy/redis/
caddy_data/
caddy_config/

# Node
node_modules/
npm-debug.log*
coverage/

# OS/editor
.DS_Store
.idea/
.vscode/

# Temporary files
tmp/
*.log
```

- [ ] **Step 2: Verify ignored files**

Run:

```bash
git status --short
git check-ignore -v deploy/.env || true
```

Expected:

```text
?? .gitignore
```

The `git check-ignore` command should show `.gitignore` as the source once `deploy/.env` exists later.

- [ ] **Step 3: Commit**

Run:

```bash
git add .gitignore
git commit -m "chore: add repository ignore rules"
```

Expected: commit succeeds.

## Task 2: Add Deployment Configuration

**Files:**
- Create: `deploy/.env.example`
- Create: `deploy/docker-compose.yml`
- Create: `deploy/Caddyfile`

- [ ] **Step 1: Create environment template**

Create `deploy/.env.example`:

```dotenv
# Public host. For the temporary domain, use a real HTTPS-capable hostname.
APP_HOST=api.example.com

# New API
NEW_API_IMAGE=calciumion/new-api:latest
NEW_API_SESSION_SECRET=replace-with-64-char-random-string
NEW_API_CRYPTO_SECRET=replace-with-32-char-random-string
NEW_API_ADMIN_ACCESS_TOKEN=replace-with-new-api-admin-access-token
NEW_API_QUOTA_PER_USD=500000

# MySQL
MYSQL_DATABASE=new_api
MYSQL_USER=newapi
MYSQL_PASSWORD=replace-with-random-mysql-password
MYSQL_ROOT_PASSWORD=replace-with-random-root-password

# Redis
REDIS_PASSWORD=replace-with-random-redis-password

# Payment bridge
PAYMENT_BRIDGE_SESSION_SECRET=replace-with-64-char-random-string
NOWPAYMENTS_API_KEY=replace-with-nowpayments-api-key
NOWPAYMENTS_IPN_SECRET=replace-with-nowpayments-ipn-secret
NOWPAYMENTS_API_BASE=https://api.nowpayments.io/v1
PAYMENT_PUBLIC_BASE_URL=https://api.example.com

# Recharge policy
RECHARGE_ALLOWED_AMOUNTS=10,25,50,100
RECHARGE_CURRENCY=USDTTRC20
RECHARGE_CREDIT_MULTIPLIER=1

# Operations
TZ=UTC
```

- [ ] **Step 2: Create Docker Compose file**

Create `deploy/docker-compose.yml`:

```yaml
services:
  caddy:
    image: caddy:2.8
    container_name: caddy
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config
    environment:
      - APP_HOST=${APP_HOST}
    depends_on:
      - new-api
      - payment-bridge
    networks:
      - app

  new-api:
    image: ${NEW_API_IMAGE}
    container_name: new-api
    restart: unless-stopped
    command: --log-dir /app/logs
    expose:
      - "3000"
    volumes:
      - ./logs/new-api:/app/logs
      - ./data/new-api:/data
    environment:
      - SQL_DSN=${MYSQL_USER}:${MYSQL_PASSWORD}@tcp(mysql:3306)/${MYSQL_DATABASE}?charset=utf8mb4&parseTime=True&loc=Local
      - REDIS_CONN_STRING=redis://:${REDIS_PASSWORD}@redis:6379
      - SESSION_SECRET=${NEW_API_SESSION_SECRET}
      - CRYPTO_SECRET=${NEW_API_CRYPTO_SECRET}
      - TZ=${TZ}
      - ERROR_LOG_ENABLED=true
      - BATCH_UPDATE_ENABLED=true
      - NODE_NAME=stage-1-sg-1
    depends_on:
      mysql:
        condition: service_healthy
      redis:
        condition: service_started
    healthcheck:
      test: ["CMD-SHELL", "wget -q -O - http://localhost:3000/api/status | grep -o '\"success\":\\s*true' || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 5
    networks:
      - app

  payment-bridge:
    build:
      context: ../payment-bridge
    container_name: payment-bridge
    restart: unless-stopped
    expose:
      - "8080"
    environment:
      - PORT=8080
      - DATABASE_URL=mysql://${MYSQL_USER}:${MYSQL_PASSWORD}@mysql:3306/${MYSQL_DATABASE}
      - NEW_API_BASE_URL=http://new-api:3000
      - NEW_API_ADMIN_ACCESS_TOKEN=${NEW_API_ADMIN_ACCESS_TOKEN}
      - NEW_API_QUOTA_PER_USD=${NEW_API_QUOTA_PER_USD}
      - NOWPAYMENTS_API_KEY=${NOWPAYMENTS_API_KEY}
      - NOWPAYMENTS_IPN_SECRET=${NOWPAYMENTS_IPN_SECRET}
      - NOWPAYMENTS_API_BASE=${NOWPAYMENTS_API_BASE}
      - PAYMENT_PUBLIC_BASE_URL=${PAYMENT_PUBLIC_BASE_URL}
      - RECHARGE_ALLOWED_AMOUNTS=${RECHARGE_ALLOWED_AMOUNTS}
      - RECHARGE_CURRENCY=${RECHARGE_CURRENCY}
      - RECHARGE_CREDIT_MULTIPLIER=${RECHARGE_CREDIT_MULTIPLIER}
      - TZ=${TZ}
    depends_on:
      mysql:
        condition: service_healthy
      new-api:
        condition: service_healthy
    healthcheck:
      test: ["CMD-SHELL", "node -e \"fetch('http://localhost:8080/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))\""]
      interval: 30s
      timeout: 10s
      retries: 5
    networks:
      - app

  mysql:
    image: mysql:8.4
    container_name: mysql
    restart: unless-stopped
    command:
      - --character-set-server=utf8mb4
      - --collation-server=utf8mb4_unicode_ci
    environment:
      - MYSQL_DATABASE=${MYSQL_DATABASE}
      - MYSQL_USER=${MYSQL_USER}
      - MYSQL_PASSWORD=${MYSQL_PASSWORD}
      - MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD}
      - TZ=${TZ}
    volumes:
      - mysql_data:/var/lib/mysql
    healthcheck:
      test: ["CMD-SHELL", "mysqladmin ping -h localhost -u${MYSQL_USER} -p${MYSQL_PASSWORD} --silent"]
      interval: 10s
      timeout: 5s
      retries: 12
    networks:
      - app

  redis:
    image: redis:7.4-alpine
    container_name: redis
    restart: unless-stopped
    command: ["redis-server", "--requirepass", "${REDIS_PASSWORD}", "--appendonly", "yes"]
    volumes:
      - redis_data:/data
    networks:
      - app

volumes:
  mysql_data:
  redis_data:
  caddy_data:
  caddy_config:

networks:
  app:
    driver: bridge
```

- [ ] **Step 3: Create Caddyfile**

Create `deploy/Caddyfile`:

```caddyfile
{
	email admin@{$APP_HOST}
}

{$APP_HOST} {
	encode zstd gzip

	handle /payment/* {
		reverse_proxy payment-bridge:8080
	}

	handle /health/payment {
		rewrite * /health
		reverse_proxy payment-bridge:8080
	}

	handle {
		reverse_proxy new-api:3000
	}
}
```

- [ ] **Step 4: Validate Compose syntax**

Run:

```bash
cd deploy
cp .env.example .env
docker compose config
```

Expected: Docker Compose prints a merged configuration and exits successfully.

- [ ] **Step 5: Commit**

Run:

```bash
git add deploy/.env.example deploy/docker-compose.yml deploy/Caddyfile
git commit -m "chore: add stage one deployment config"
```

Expected: commit succeeds.

## Task 3: Scaffold Payment Bridge

**Files:**
- Create: `payment-bridge/package.json`
- Create: `payment-bridge/Dockerfile`
- Create: `payment-bridge/src/index.js`
- Create: `payment-bridge/src/config.js`
- Create: `payment-bridge/src/server.js`

- [ ] **Step 1: Create package manifest**

Create `payment-bridge/package.json`:

```json
{
  "name": "payment-bridge",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "start": "node src/index.js",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "express": "^4.19.2",
    "mysql2": "^3.11.0",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "supertest": "^7.0.0",
    "vitest": "^2.0.5"
  }
}
```

- [ ] **Step 2: Create Dockerfile**

Create `payment-bridge/Dockerfile`:

```dockerfile
FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --omit=dev

COPY src ./src

ENV NODE_ENV=production
CMD ["npm", "start"]
```

- [ ] **Step 3: Create config module**

Create `payment-bridge/src/config.js`:

```js
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(8080),
  DATABASE_URL: z.string().min(1),
  NEW_API_BASE_URL: z.string().url(),
  NEW_API_ADMIN_ACCESS_TOKEN: z.string().min(16),
  NEW_API_QUOTA_PER_USD: z.coerce.number().int().positive().default(500000),
  NOWPAYMENTS_API_KEY: z.string().min(16),
  NOWPAYMENTS_IPN_SECRET: z.string().min(16),
  NOWPAYMENTS_API_BASE: z.string().url().default('https://api.nowpayments.io/v1'),
  PAYMENT_PUBLIC_BASE_URL: z.string().url(),
  RECHARGE_ALLOWED_AMOUNTS: z.string().default('10,25,50,100'),
  RECHARGE_CURRENCY: z.string().default('USDTTRC20'),
  RECHARGE_CREDIT_MULTIPLIER: z.coerce.number().positive().default(1)
});

export function loadConfig(env = process.env) {
  const parsed = envSchema.parse(env);
  const allowedAmounts = parsed.RECHARGE_ALLOWED_AMOUNTS
    .split(',')
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isInteger(value) && value > 0);

  if (allowedAmounts.length === 0) {
    throw new Error('RECHARGE_ALLOWED_AMOUNTS must contain at least one positive integer');
  }

  return {
    port: parsed.PORT,
    databaseUrl: parsed.DATABASE_URL,
    newApiBaseUrl: parsed.NEW_API_BASE_URL.replace(/\/$/, ''),
    newApiAdminAccessToken: parsed.NEW_API_ADMIN_ACCESS_TOKEN,
    newApiQuotaPerUsd: parsed.NEW_API_QUOTA_PER_USD,
    nowpaymentsApiKey: parsed.NOWPAYMENTS_API_KEY,
    nowpaymentsIpnSecret: parsed.NOWPAYMENTS_IPN_SECRET,
    nowpaymentsApiBase: parsed.NOWPAYMENTS_API_BASE.replace(/\/$/, ''),
    paymentPublicBaseUrl: parsed.PAYMENT_PUBLIC_BASE_URL.replace(/\/$/, ''),
    allowedAmounts,
    rechargeCurrency: parsed.RECHARGE_CURRENCY,
    rechargeCreditMultiplier: parsed.RECHARGE_CREDIT_MULTIPLIER
  };
}
```

- [ ] **Step 4: Create minimal server**

Create `payment-bridge/src/server.js`:

```js
import express from 'express';

export function createServer() {
  const app = express();

  app.get('/health', (_req, res) => {
    res.json({ success: true, service: 'payment-bridge' });
  });

  return app;
}
```

- [ ] **Step 5: Create entrypoint**

Create `payment-bridge/src/index.js`:

```js
import { loadConfig } from './config.js';
import { createServer } from './server.js';

const config = loadConfig();
const app = createServer({ config });

app.listen(config.port, () => {
  console.log(`payment-bridge listening on ${config.port}`);
});
```

- [ ] **Step 6: Install dependencies and run tests**

Run:

```bash
cd payment-bridge
npm install
npm test
```

Expected: `npm test` runs Vitest and reports no tests found or exits successfully after test files are added in later tasks. If Vitest exits non-zero because there are no tests, continue after Task 4 adds tests.

- [ ] **Step 7: Commit**

Run:

```bash
git add payment-bridge
git commit -m "feat: scaffold payment bridge service"
```

Expected: commit succeeds.

## Task 4: Implement NOWPayments Helpers

**Files:**
- Create: `payment-bridge/src/nowpayments.js`
- Create: `payment-bridge/test/nowpayments.test.js`

- [ ] **Step 1: Write signature tests**

Create `payment-bridge/test/nowpayments.test.js`:

```js
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
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
cd payment-bridge
npm test -- nowpayments
```

Expected: FAIL because `../src/nowpayments.js` does not exist.

- [ ] **Step 3: Implement helper module**

Create `payment-bridge/src/nowpayments.js`:

```js
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

  if (actual.length !== expected.length) {
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
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
cd payment-bridge
npm test -- nowpayments
```

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
git add payment-bridge/src/nowpayments.js payment-bridge/test/nowpayments.test.js payment-bridge/package.json payment-bridge/package-lock.json
git commit -m "feat: add nowpayments helpers"
```

Expected: commit succeeds.

## Task 5: Implement Database Migration and Order Store

**Files:**
- Create: `payment-bridge/src/db.js`
- Create: `payment-bridge/src/migrations.js`
- Create: `payment-bridge/src/orders.js`
- Create: `payment-bridge/test/orders.test.js`

- [ ] **Step 1: Write unit tests for recharge validation and idempotency helpers**

Create `payment-bridge/test/orders.test.js`:

```js
import { describe, expect, it } from 'vitest';
import { calculateQuota, isAllowedAmount, isFinalPaidStatus } from '../src/orders.js';

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
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
cd payment-bridge
npm test -- orders
```

Expected: FAIL because `../src/orders.js` does not exist.

- [ ] **Step 3: Create migration module**

Create `payment-bridge/src/migrations.js`:

```js
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
      KEY idx_payment_orders_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}
```

- [ ] **Step 4: Create database module**

Create `payment-bridge/src/db.js`:

```js
import mysql from 'mysql2/promise';

export function createPool(config) {
  return mysql.createPool({
    uri: config.databaseUrl,
    waitForConnections: true,
    connectionLimit: 10,
    namedPlaceholders: true
  });
}
```

- [ ] **Step 5: Create orders module**

Create `payment-bridge/src/orders.js`:

```js
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

  const [rows] = await pool.query(
    `SELECT * FROM payment_orders
     WHERE id = :orderId
        OR (nowpayments_payment_id IS NOT NULL AND nowpayments_payment_id = :paymentId)
     LIMIT 1`,
    { orderId, paymentId }
  );

  return rows[0] || null;
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

export async function markCreditedOnce(pool, orderId) {
  const now = Math.floor(Date.now() / 1000);
  const [result] = await pool.query(
    `UPDATE payment_orders
     SET status = 'credited',
         credited_at = :now,
         updated_at = :now
     WHERE id = :orderId
       AND credited_at IS NULL
       AND status <> 'credited'`,
    { orderId, now }
  );

  return result.affectedRows === 1;
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run:

```bash
cd payment-bridge
npm test
```

Expected: PASS.

- [ ] **Step 7: Commit**

Run:

```bash
git add payment-bridge/src/db.js payment-bridge/src/migrations.js payment-bridge/src/orders.js payment-bridge/test/orders.test.js
git commit -m "feat: add payment order storage"
```

Expected: commit succeeds.

## Task 6: Implement New API Credit Client

**Files:**
- Create: `payment-bridge/src/newApiClient.js`

- [ ] **Step 1: Create New API client module**

Create `payment-bridge/src/newApiClient.js`:

```js
export async function addUserQuota({ config, userId, quota }) {
  const response = await fetch(`${config.newApiBaseUrl}/api/user/manage`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.newApiAdminAccessToken}`
    },
    body: JSON.stringify({
      id: userId,
      action: 'add_quota',
      mode: 'add',
      value: quota
    })
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok || payload.success !== true) {
    throw new Error(`New API quota add failed: ${response.status} ${JSON.stringify(payload)}`);
  }

  return payload;
}
```

- [ ] **Step 2: Verify endpoint against inspected New API code**

Run:

```bash
rg -n 'adminRoute.POST\\("/manage"|case "add_quota"|type ManageRequest' /tmp/new-api-inspect/controller /tmp/new-api-inspect/router
```

Expected output includes:

```text
router/api-router.go:139: adminRoute.POST("/manage", controller.ManageUser)
controller/user.go:... type ManageRequest struct
controller/user.go:... case "add_quota":
```

- [ ] **Step 3: Commit**

Run:

```bash
git add payment-bridge/src/newApiClient.js
git commit -m "feat: add new api quota client"
```

Expected: commit succeeds.

## Task 7: Implement Payment Bridge Routes

**Files:**
- Modify: `payment-bridge/src/server.js`
- Modify: `payment-bridge/src/index.js`

- [ ] **Step 1: Update server routes**

Replace `payment-bridge/src/server.js` with:

```js
import express from 'express';
import { z } from 'zod';
import { addUserQuota } from './newApiClient.js';
import { createNowpaymentsInvoice, isValidIpnSignature } from './nowpayments.js';
import {
  attachInvoice,
  createPendingOrder,
  findOrderForIpn,
  isFinalPaidStatus,
  markCreditedOnce,
  markIpnObserved
} from './orders.js';

const createInvoiceSchema = z.object({
  user_id: z.coerce.number().int().positive(),
  amount: z.coerce.number().int().positive()
});

export function createServer({ config, pool }) {
  const app = express();

  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (_req, res) => {
    res.json({ success: true, service: 'payment-bridge' });
  });

  app.post('/payment/create', async (req, res) => {
    try {
      const input = createInvoiceSchema.parse(req.body);
      const order = await createPendingOrder(pool, config, {
        userId: input.user_id,
        amountUsd: input.amount
      });
      const invoice = await createNowpaymentsInvoice({ config, order });
      await attachInvoice(pool, order.id, invoice);

      res.json({
        success: true,
        data: {
          order_id: order.id,
          amount: order.amountUsd,
          currency: order.currency,
          invoice_url: invoice.invoice_url,
          nowpayments_invoice_id: invoice.id || invoice.invoice_id || null
        }
      });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  });

  app.post('/payment/ipn', async (req, res) => {
    const signature = req.header('x-nowpayments-sig');

    if (!isValidIpnSignature(req.body, signature, config.nowpaymentsIpnSecret)) {
      res.status(401).json({ success: false, message: 'invalid signature' });
      return;
    }

    const order = await findOrderForIpn(pool, req.body);
    if (!order) {
      res.status(404).json({ success: false, message: 'order not found' });
      return;
    }

    await markIpnObserved(pool, order.id, req.body);

    if (!isFinalPaidStatus(req.body.payment_status)) {
      res.json({ success: true, data: { credited: false, status: req.body.payment_status } });
      return;
    }

    const paidCurrency = String(req.body.pay_currency || '').toUpperCase();
    if (paidCurrency !== config.rechargeCurrency.toUpperCase()) {
      res.status(400).json({ success: false, message: 'currency mismatch' });
      return;
    }

    const actuallyPaid = Number(req.body.actually_paid || 0);
    if (actuallyPaid + 1e-8 < Number(order.amount_usd)) {
      res.status(400).json({ success: false, message: 'underpaid order' });
      return;
    }

    const shouldCredit = await markCreditedOnce(pool, order.id);
    if (shouldCredit) {
      await addUserQuota({
        config,
        userId: Number(order.user_id),
        quota: Number(order.quota_to_add)
      });
    }

    res.json({ success: true, data: { credited: shouldCredit } });
  });

  return app;
}
```

- [ ] **Step 2: Update entrypoint**

Replace `payment-bridge/src/index.js` with:

```js
import { loadConfig } from './config.js';
import { createPool } from './db.js';
import { runMigrations } from './migrations.js';
import { createServer } from './server.js';

const config = loadConfig();
const pool = createPool(config);

await runMigrations(pool);

const app = createServer({ config, pool });

app.listen(config.port, () => {
  console.log(`payment-bridge listening on ${config.port}`);
});
```

- [ ] **Step 3: Run tests**

Run:

```bash
cd payment-bridge
npm test
```

Expected: PASS.

- [ ] **Step 4: Commit**

Run:

```bash
git add payment-bridge/src/server.js payment-bridge/src/index.js
git commit -m "feat: add nowpayments recharge routes"
```

Expected: commit succeeds.

## Task 8: Add Deployment and Operations Documentation

**Files:**
- Create: `deploy/README.md`
- Create: `docs/operations/stage-1-runbook.md`

- [ ] **Step 1: Create deployment README**

Create `deploy/README.md`:

```markdown
# Stage 1 Deployment

## Environments

- Local Mac: Docker Desktop, MySQL and Redis in Docker.
- Tencent Cloud Lighthouse staging: public webhook and restart testing.
- Hetzner Cloud Singapore production: 4 vCPU / 8 GB RAM, Ubuntu 24.04 LTS.

## Initial Server Setup

```bash
apt update
apt upgrade -y
apt install -y ca-certificates curl git ufw
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" > /etc/apt/sources.list.d/docker.list
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
```

## Configure Environment

```bash
export SERVER_IP=203.0.113.10
rsync -az --exclude .git --exclude deploy/.env --exclude node_modules /Users/Admin/Desktop/api/ root@$SERVER_IP:/opt/api/
ssh root@$SERVER_IP
cd /opt/api/deploy
cp .env.example .env
openssl rand -hex 32
```

Edit `.env` and set every `replace-with-*` value before starting services. Use separate `.env` values for staging and production; do not copy staging secrets into production.

## Start

```bash
cd /opt/api/deploy
docker compose up -d --build
docker compose ps
docker compose logs -f new-api payment-bridge caddy
```

## New API Admin Setup

1. Open `https://$APP_HOST`.
2. Complete first admin setup.
3. Create or copy a dedicated admin access token for the payment bridge.
4. Set `NEW_API_ADMIN_ACCESS_TOKEN` in `deploy/.env`.
5. Restart the payment bridge:

```bash
docker compose up -d payment-bridge
```

## Provider Channels

Configure these channels in New API admin:

- DeepSeek
- Kimi / Moonshot
- OpenAI
- Anthropic Claude API

Keep provider names visible in model names or descriptions. Do not silently route one provider family to another.

## Backup

```bash
docker exec mysql mysqldump -u root -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE" > "backup-$(date +%F-%H%M%S).sql"
```
```

- [ ] **Step 2: Create operations runbook**

Create `docs/operations/stage-1-runbook.md`:

```markdown
# Stage 1 Operations Runbook

## Daily Checks

```bash
cd /opt/api/deploy
docker compose ps
docker compose logs --since=24h payment-bridge | tail -200
docker compose logs --since=24h new-api | tail -200
```

## Payment Incident: User Paid But Was Not Credited

1. Ask for the NOWPayments invoice ID and user email.
2. Check `payment_orders`:

```bash
docker exec -it mysql mysql -u root -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE" \
  -e "SELECT * FROM payment_orders ORDER BY created_at DESC LIMIT 20\G"
```

3. If NOWPayments shows final paid status and the order is not credited, use New API admin to add the fixed amount manually.
4. Mark the order internally by updating `status='manual_credited'` and adding an incident note outside the database.

## Abuse Response

1. Disable the user's API key in New API.
2. Disable the user if abuse continues.
3. Disable affected provider channel if upstream errors or cost spikes.
4. Keep prepaid-only billing. Do not enable unlimited plans in Stage 1.

## Provider Outage

1. Disable the failing channel in New API.
2. Keep provider family names transparent.
3. Do not silently route Claude requests to DeepSeek, Kimi, or OpenAI.

## Before Public Launch

- HTTPS works.
- Payment bridge health endpoint works.
- NOWPayments IPN secret is non-empty.
- A low-value USDT payment credits exactly once.
- DeepSeek request succeeds.
- Kimi request succeeds.
- OpenAI request succeeds.
- Anthropic request succeeds.
- Balance decreases after usage.
- Admin can disable a user key.
```

- [ ] **Step 3: Commit**

Run:

```bash
git add deploy/README.md docs/operations/stage-1-runbook.md
git commit -m "docs: add stage one deployment runbooks"
```

Expected: commit succeeds.

## Task 9: Add Smoke Verification Script

**Files:**
- Create: `scripts/verify-mvp.sh`

- [ ] **Step 1: Create verification script**

Create `scripts/verify-mvp.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

HOST="${1:-}"

if [ -z "$HOST" ]; then
  echo "Usage: $0 https://api.example.com"
  exit 2
fi

echo "Checking New API status..."
curl -fsS "$HOST/api/status" | grep -q '"success":true'

echo "Checking payment bridge health..."
curl -fsS "$HOST/health/payment" | grep -q '"success":true'

echo "Checking local containers..."
if command -v docker >/dev/null 2>&1 && [ -f deploy/docker-compose.yml ]; then
  (cd deploy && docker compose ps)
fi

echo "MVP smoke checks passed."
```

- [ ] **Step 2: Make script executable and run syntax check**

Run:

```bash
chmod +x scripts/verify-mvp.sh
bash -n scripts/verify-mvp.sh
```

Expected: no output from `bash -n`.

- [ ] **Step 3: Commit**

Run:

```bash
git add scripts/verify-mvp.sh
git commit -m "chore: add mvp verification script"
```

Expected: commit succeeds.

## Task 10: Local Compose Validation

**Files:**
- Modify only if validation reveals syntax errors: `deploy/docker-compose.yml`, `deploy/Caddyfile`, payment bridge files.

- [ ] **Step 1: Generate local secrets**

Run:

```bash
cd deploy
cp .env.example .env
python3 - <<'PY'
from pathlib import Path
import secrets

path = Path('.env')
text = path.read_text()
replacements = {
    'api.example.com': 'localhost',
    'replace-with-64-char-random-string': secrets.token_hex(32),
    'replace-with-32-char-random-string': secrets.token_hex(16),
    'replace-with-random-mysql-password': secrets.token_urlsafe(24),
    'replace-with-random-root-password': secrets.token_urlsafe(24),
    'replace-with-random-redis-password': secrets.token_urlsafe(24),
    'replace-with-nowpayments-api-key': 'local-nowpayments-api-key-123456',
    'replace-with-nowpayments-ipn-secret': 'local-nowpayments-ipn-secret-123456',
    'replace-with-new-api-admin-access-token': 'local-new-api-admin-token-123456'
}
for old, new in replacements.items():
    text = text.replace(old, new, 1)
path.write_text(text)
PY
```

Expected: `deploy/.env` exists and is ignored by git.

- [ ] **Step 2: Validate Compose config**

Run:

```bash
cd deploy
docker compose config >/tmp/new-api-mvp-compose.yml
```

Expected: exits successfully.

- [ ] **Step 3: Build payment bridge**

Run:

```bash
cd deploy
docker compose build payment-bridge
```

Expected: payment bridge image builds successfully.

- [ ] **Step 4: Run bridge tests**

Run:

```bash
cd payment-bridge
npm test
```

Expected: PASS.

- [ ] **Step 5: Commit fixes if any**

If validation required changes, run:

```bash
git add deploy payment-bridge scripts docs
git commit -m "fix: resolve local mvp validation issues"
```

Expected: commit succeeds only if files changed.

## Task 11: Pin Validated New API Image

**Files:**
- Modify: `deploy/.env.example`
- Modify only if validation reveals image issues: `deploy/docker-compose.yml`

- [ ] **Step 1: Pull and inspect the candidate image**

Run:

```bash
docker pull calciumion/new-api:latest
docker image inspect calciumion/new-api:latest --format '{{index .RepoDigests 0}}'
```

Expected: output looks like:

```text
calciumion/new-api@sha256:...
```

- [ ] **Step 2: Update image reference template**

Edit `deploy/.env.example` and replace:

```dotenv
NEW_API_IMAGE=calciumion/new-api:latest
```

with:

```dotenv
NEW_API_IMAGE=calciumion/new-api@sha256:replace-with-validated-image-digest
```

- [ ] **Step 3: Validate Compose still accepts the digest form**

Run:

```bash
cd deploy
cp .env.example .env
NEW_API_IMAGE_DIGEST="$(docker image inspect calciumion/new-api:latest --format '{{index .RepoDigests 0}}' | sed 's/^calciumion\\/new-api@sha256://')"
perl -0pi -e "s/replace-with-validated-image-digest/$ENV{NEW_API_IMAGE_DIGEST}/" .env
docker compose config >/tmp/new-api-mvp-compose-pinned.yml
```

Expected: exits successfully and `NEW_API_IMAGE` in the rendered config uses `calciumion/new-api@sha256:...`.

- [ ] **Step 4: Commit**

Run:

```bash
git add deploy/.env.example deploy/docker-compose.yml
git commit -m "chore: pin new api image template"
```

Expected: commit succeeds.

## Task 12: Tencent Cloud Staging Execution

**Files:**
- No repository changes expected unless staging reveals config errors.

- [ ] **Step 1: Provision server**

Use the existing Tencent Cloud Lighthouse server as staging:

```text
Provider: Tencent Cloud Lighthouse
Image: Ubuntu 24.04
Size: 4 vCPU / 8 GB RAM
SSH: key-only login
```

- [ ] **Step 2: Install Docker and firewall**

Run the commands from `deploy/README.md` under "Initial Server Setup".

Expected:

```bash
docker --version
docker compose version
ufw status
```

show Docker, Compose, and active firewall rules for SSH, 80, and 443.

- [ ] **Step 3: Deploy repository**

Copy this repository to staging:

```text
/opt/api
```

Then run:

```bash
export STAGING_IP=203.0.113.20
rsync -az --exclude .git --exclude deploy/.env --exclude node_modules /Users/Admin/Desktop/api/ root@$STAGING_IP:/opt/api/
ssh root@$STAGING_IP
cd /opt/api/deploy
cp .env.example .env
```

Edit `.env` with staging secrets, the temporary HTTPS hostname, and NOWPayments credentials.

- [ ] **Step 4: Start services**

Run:

```bash
cd /opt/api/deploy
docker compose up -d --build
docker compose ps
```

Expected: `new-api`, `mysql`, `redis`, `payment-bridge`, and `caddy` are running or healthy.

- [ ] **Step 5: Complete New API admin setup**

Open:

```text
https://$APP_HOST
```

Create the root admin account. Generate or copy a dedicated admin access token for the payment bridge, place it in `NEW_API_ADMIN_ACCESS_TOKEN`, then restart:

```bash
cd /opt/api/deploy
docker compose up -d payment-bridge
```

- [ ] **Step 6: Configure provider channels**

In New API admin, configure:

```text
DeepSeek
Kimi / Moonshot
OpenAI
Anthropic Claude API
```

Set conservative user and model limits before accepting public users.

- [ ] **Step 7: Run smoke script**

Run:

```bash
cd /opt/api
./scripts/verify-mvp.sh "https://$APP_HOST"
```

Expected:

```text
MVP smoke checks passed.
```

- [ ] **Step 8: Fix and commit staging issues**

If staging reveals repository changes, make the changes locally, commit them, push them, and redeploy to staging.

Expected: staging passes the smoke script before production execution begins.

## Task 13: Hetzner Production Execution

**Files:**
- No repository changes expected unless production reveals config errors.

- [ ] **Step 1: Provision production server**

Create a Hetzner Cloud server:

```text
Location: Singapore
Image: Ubuntu 24.04
Size: 4 vCPU / 8 GB RAM
SSH: key-only login
```

- [ ] **Step 2: Install Docker and firewall**

Run the commands from `deploy/README.md` under "Initial Server Setup".

Expected:

```bash
docker --version
docker compose version
ufw status
```

show Docker, Compose, and active firewall rules for SSH, 80, and 443.

- [ ] **Step 3: Deploy repository**

Copy this repository to production:

```bash
export PROD_IP=203.0.113.30
rsync -az --exclude .git --exclude deploy/.env --exclude node_modules /Users/Admin/Desktop/api/ root@$PROD_IP:/opt/api/
ssh root@$PROD_IP
cd /opt/api/deploy
cp .env.example .env
```

Edit `.env` with production secrets, the production temporary HTTPS hostname, and NOWPayments credentials.

- [ ] **Step 4: Start services**

Run:

```bash
cd /opt/api/deploy
docker compose up -d --build
docker compose ps
```

Expected: `new-api`, `mysql`, `redis`, `payment-bridge`, and `caddy` are running or healthy.

- [ ] **Step 5: Complete New API admin setup**

Open:

```text
https://$APP_HOST
```

Create the root admin account. Generate or copy a dedicated admin access token for the payment bridge, place it in `NEW_API_ADMIN_ACCESS_TOKEN`, then restart:

```bash
cd /opt/api/deploy
docker compose up -d payment-bridge
```

- [ ] **Step 6: Configure provider channels**

In New API admin, configure:

```text
DeepSeek
Kimi / Moonshot
OpenAI
Anthropic Claude API
```

Set conservative user and model limits before accepting public users.

- [ ] **Step 7: Run smoke script**

Run:

```bash
cd /opt/api
./scripts/verify-mvp.sh "https://$APP_HOST"
```

Expected:

```text
MVP smoke checks passed.
```

## Task 14: Commercial Loop Acceptance Test

**Files:**
- No repository changes expected unless acceptance reveals implementation bugs.

- [ ] **Step 1: Create a test user**

Use New API admin to create a normal user with a known email.

Expected: user ID is visible in New API admin.

- [ ] **Step 2: Create a 10 USDT payment invoice**

Call the bridge:

```bash
export APP_HOST=api.example.com
export TEST_USER_ID=1
curl -fsS -X POST "https://$APP_HOST/payment/create" \
  -H "Content-Type: application/json" \
  -d "{\"user_id\":$TEST_USER_ID,\"amount\":10}"
```

Set `TEST_USER_ID` to the real test user ID before running the command.

Expected response includes:

```json
{
  "success": true,
  "data": {
    "order_id": "...",
    "amount": 10,
    "currency": "USDTTRC20",
    "invoice_url": "..."
  }
}
```

- [ ] **Step 3: Complete a low-value live payment or NOWPayments sandbox-equivalent test**

Pay the generated invoice using USDT-TRC20.

Expected: NOWPayments sends IPN to `/payment/ipn`.

- [ ] **Step 4: Verify user was credited once**

Run:

```bash
docker exec -it mysql mysql -u root -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE" \
  -e "SELECT id,user_id,amount_usd,quota_to_add,status,credited_at FROM payment_orders ORDER BY created_at DESC LIMIT 5;"
```

Expected: the latest order has `status` equal to `credited` and `credited_at` is not null.

- [ ] **Step 5: Create a New API key**

Log in as the test user and create an API key.

Expected: a key is issued.

- [ ] **Step 6: Test DeepSeek-compatible request**

Run with the user's New API key:

```bash
export APP_HOST=api.example.com
export NEW_API_USER_KEY=sk-your-test-user-key
curl -fsS "https://$APP_HOST/v1/chat/completions" \
  -H "Authorization: Bearer $NEW_API_USER_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"deepseek-chat","messages":[{"role":"user","content":"Say ok"}],"max_tokens":5}'
```

Expected: model returns a response and New API records usage.

- [ ] **Step 7: Test Kimi, OpenAI, and Claude channels**

Repeat the request with one configured model from each provider family:

```text
Kimi / Moonshot
OpenAI
Anthropic Claude API
```

Expected: each provider returns a response or a clear provider-specific configuration error that can be fixed in New API admin.

- [ ] **Step 8: Verify balance deduction**

Open New API admin/user usage pages.

Expected:

```text
Usage is visible.
User balance decreased after model calls.
```

- [ ] **Step 9: Verify abuse controls**

Disable the test user's API key in New API admin and retry a request.

Expected: request is rejected.

Disable one provider channel and retry its model.

Expected: request is rejected or routed only according to explicit New API channel settings.

- [ ] **Step 10: Final commit for production corrections**

If acceptance testing required repository changes, run:

```bash
git add .
git commit -m "fix: apply production acceptance corrections"
```

Expected: commit succeeds only if files changed.

## Self-Review

- Spec coverage: The plan covers local Mac validation, Tencent Cloud Lighthouse staging, single-node Hetzner production deployment, Docker Compose, MySQL, Redis, Caddy, temporary HTTPS host, NOWPayments USDT-TRC20, fixed recharge amounts, automatic crediting, four provider families, basic abuse controls, and operational checks.
- Scope control: Stripe, formal website, Cloudflare, Kubernetes, multi-region routing, and custom gateway replacement remain out of scope.
- Placeholder scan: No task uses open-ended implementation placeholders; code and commands are specified where implementation is required.
- Risk note: New API admin access-token behavior must be verified on the deployed version during Task 6 and staging execution. If access-token auth differs, use the documented New API admin token method for that version and update `payment-bridge/src/newApiClient.js`.
- Release note: `NEW_API_IMAGE` must be pinned to a validated tag or digest before production execution.
