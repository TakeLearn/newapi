# Stage 1 Operations Runbook

Use this runbook for the Stage 1 New API commercial MVP after deployment. The normal rollout path is Local Mac validation, Tencent Cloud Lighthouse staging, then Hetzner Singapore production.

## Daily Checks

```bash
cd /opt/api/deploy
set -a
. ./.env
set +a
docker compose ps
docker compose logs --since=24h payment-bridge | tail -200
docker compose logs --since=24h new-api | tail -200
curl -fsS "https://$APP_HOST/health/payment"
curl -fsS "https://$APP_HOST/api/status"
```

Check disk usage during the same pass:

```bash
df -h
docker system df
```

## Payment Incident: User Paid But Was Not Credited

1. Ask for the NOWPayments invoice ID, payment ID if available, user email, user ID, paid amount, and payment timestamp.
2. Check recent bridge records:

```bash
cd /opt/api/deploy
docker compose exec -T mysql sh -c 'mysql -u root -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE" \
  -e "SELECT id,user_id,nowpayments_invoice_id,nowpayments_payment_id,amount_usd,quota_to_add,status,credited_at,created_at,updated_at FROM payment_orders ORDER BY created_at DESC LIMIT 20\G"'
```

3. Compare the order against the NOWPayments dashboard. Only treat final paid or confirmed statuses as eligible for manual credit. Inspect `failed` orders manually because they may represent a claimed credit attempt where New API quota crediting returned an ambiguous failure.
4. If NOWPayments shows final paid status and the order is not credited, use New API admin to add the fixed recharge amount manually to the affected user.
5. Record the manual credit outside the database in the incident notes, including operator, time, NOWPayments ID, New API user ID, amount, quota added, and reason.
6. Do not update `payment_orders.status` to an invalid value. The table status constraint only allows `pending`, `crediting`, `credited`, `failed`, and `expired`; manual credits are recorded outside DB and do not alter `payment_orders` to invalid states such as `manual_credited`.

After manual crediting, keep the order evidence intact for later reconciliation. `failed` crediting orders are not eligible for automatic quota retry; leave them for manual reconciliation and incident notes.

## Duplicate Or Suspicious Payment

1. Pause payment creation if duplicate credits are active:

```bash
cd /opt/api/deploy
docker compose stop payment-bridge
```

2. Check the affected order IDs, NOWPayments IDs, and New API user quota history.
3. Disable the affected user key if abuse or automated probing is suspected.
4. Restart the bridge only after the incident note explains the user impact and reconciliation decision:

```bash
docker compose up -d payment-bridge
docker compose logs --since=5m payment-bridge
```

## Abuse Response

1. Disable the user's API key in New API.
2. Disable the user if abuse continues.
3. Disable the affected provider channel if upstream errors or cost spikes.
4. Keep prepaid-only billing. Do not enable unlimited plans in Stage 1.

## Provider Outage

1. Disable the failing channel in New API.
2. Keep provider family names transparent.
3. Do not silently route Claude requests to DeepSeek, Kimi, or OpenAI.
4. Re-enable the provider only after a direct test request succeeds and error rates are normal.

## Deployment Promotion Checklist

- Local Mac Docker Compose build and smoke checks pass.
- `NEW_API_IMAGE` is pinned to a validated digest, not `latest` or a movable tag.
- Tencent Cloud Lighthouse staging uses a public HTTPS hostname.
- NOWPayments IPN reaches Tencent Cloud staging.
- A low-value payment credits exactly once on staging.
- Hetzner production uses separate production secrets and production DNS.
- The same validated New API image digest from staging is used for production.

## Wallet NOWPayments Top-Up Check

After deploying the custom New API image, verify the native wallet top-up entry:

```bash
cd /opt/api/deploy
docker compose ps
curl -fsS "https://$APP_HOST/health/payment"
curl -fsS "https://$APP_HOST/api/status"
```

Open:

```text
https://$APP_HOST/console/topup
```

Confirm:

- The USDT-BSC (BEP20) top-up card appears.
- The UI follows the selected language.
- Amount buttons show 20, 30, 50, and 100.
- Clicking the payment button creates a NOWPayments invoice.
- The browser redirects to the invoice URL.

Invoice creation and redirect only prove checkout startup, not payment success. Do not treat the browser return URL as proof of payment. Confirm crediting only after NOWPayments IPN arrives by checking a `credited` order with `credited_at` set in `payment_orders` and a matching user quota increase.

## Before Public Launch

- HTTPS works.
- Payment bridge health endpoint works.
- NOWPayments IPN secret is non-empty.
- A low-value USDT payment credits exactly once.
- DeepSeek request succeeds.
- Kimi / Moonshot request succeeds.
- OpenAI request succeeds.
- Anthropic Claude request succeeds.
- Balance decreases after usage.
- Admin can disable a user key.
- Backup and restore have been tested on staging.
