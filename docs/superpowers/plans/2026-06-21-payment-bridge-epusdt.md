# Payment Bridge Epusdt Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the NOWPayments-specific payment bridge path with an Epusdt-backed USDT-TRC20 payment provider while keeping the existing New API-facing `/payment/create` contract stable.

**Architecture:** `payment-bridge` remains the boundary between New API and payment infrastructure. It creates local orders, asks Epusdt/GMPay for a cashier transaction, accepts Epusdt async callbacks, validates signatures and amounts, then credits New API exactly once through the existing quota client.

**Tech Stack:** Node.js ESM, Express, MySQL, Vitest, Epusdt GMPay-compatible HTTP API.

---

### Task 1: Add Epusdt Provider Adapter

**Files:**
- Create: `payment-bridge/src/epusdt.js`
- Create: `payment-bridge/test/epusdt.test.js`

- [ ] **Step 1: Write failing tests for Epusdt signatures and order creation.**
- [ ] **Step 2: Run `npm test -- test/epusdt.test.js` and confirm missing module/function failures.**
- [ ] **Step 3: Implement `createEpusdtTransaction`, `isValidEpusdtSignature`, and signature helpers.**
- [ ] **Step 4: Run `npm test -- test/epusdt.test.js` and confirm green.**

### Task 2: Switch Server Routes To Epusdt

**Files:**
- Modify: `payment-bridge/src/server.js`
- Modify: `payment-bridge/test/server.test.js`

- [ ] **Step 1: Update route tests so `/payment/create` returns an Epusdt cashier URL and `/payment/ipn` validates Epusdt callback signatures.**
- [ ] **Step 2: Run `npm test -- test/server.test.js` and confirm the old NOWPayments wiring fails.**
- [ ] **Step 3: Replace NOWPayments route integration with Epusdt integration while preserving response shape for the frontend.**
- [ ] **Step 4: Run `npm test -- test/server.test.js` and confirm green.**

### Task 3: Generalize Order Storage

**Files:**
- Modify: `payment-bridge/src/orders.js`
- Modify: `payment-bridge/src/migrations.js`
- Modify: `payment-bridge/test/orders.test.js`

- [ ] **Step 1: Add failing tests for provider-neutral invoice/payment fields and Epusdt paid status.**
- [ ] **Step 2: Run `npm test -- test/orders.test.js` and confirm failures.**
- [ ] **Step 3: Add generic provider fields while keeping legacy NOWPayments columns compatible for existing deployments.**
- [ ] **Step 4: Run `npm test -- test/orders.test.js` and confirm green.**

### Task 4: Update Configuration And Deployment

**Files:**
- Modify: `payment-bridge/src/config.js`
- Modify: `payment-bridge/test/config.test.js`
- Modify: `deploy/.env.example`
- Modify: `deploy/docker-compose.yml`

- [ ] **Step 1: Add failing config tests for Epusdt defaults and required secrets.**
- [ ] **Step 2: Run `npm test -- test/config.test.js` and confirm failures.**
- [ ] **Step 3: Replace NOWPayments env requirements with `EPUSDT_*` values and default to `USDTTRC20` low-value tiers.**
- [ ] **Step 4: Run `npm test -- test/config.test.js` and confirm green.**

### Task 5: Verify Full Bridge

**Files:**
- Modify as needed only if verification reveals integration defects.

- [ ] **Step 1: Run `npm test` in `payment-bridge`.**
- [ ] **Step 2: Fix any regressions using focused failing tests first.**
- [ ] **Step 3: Run `npm test` again and confirm all tests pass.**
