# New API Wallet NOWPayments Top-Up Design

## Goal

Add a native NOWPayments USDT-BSC (BEP20) recharge entry to the New API wallet page so users can top up from the existing wallet flow instead of visiting a separate payment page.

The first version is for the Stage 1 MVP and must keep the working payment bridge flow unchanged:

1. The logged-in user opens Wallet Management.
2. The user selects a fixed USDT-BSC (BEP20) amount.
3. The frontend creates a NOWPayments invoice through the payment bridge.
4. The browser redirects to the NOWPayments invoice URL.
5. The payment bridge credits the user only after a valid NOWPayments IPN webhook.

## Scope

### In Scope

- Modify the New API classic wallet/top-up page.
- Add a NOWPayments recharge card inside the wallet management experience.
- Use the current logged-in user's ID instead of asking the user to type a user ID.
- Support fixed amounts: 20, 30, 50, and 100 USDT.
- Use same-origin `POST /payment/create` through Caddy.
- Redirect the browser to the returned `invoice_url`.
- Show loading and error states.
- Add English and simplified Chinese i18n text using the existing New API language system.
- Build and deploy a custom New API image for this testing server.

### Out Of Scope

- Replacing the payment bridge.
- Trusting frontend return URLs as payment proof.
- Showing real-time payment status polling.
- Adding arbitrary recharge amounts.
- Adding payment methods beyond USDT-BSC (BEP20).
- Supporting MiMo Token Plan as a public paid channel.
- Redesigning the full wallet page.
- Building a standalone marketing site.

## UX

The wallet page should show a compact card near the existing recharge controls.

The card content is:

- Title: `USDT-BSC (BEP20) Top-up`
- Supporting text: `Pay with USDT-BSC (BEP20). On Binance, choose BSC / BNB Smart Chain (BEP20). Credits are added after confirmation.`
- Amount options: `$20`, `$30`, `$50`, `$100`
- Primary button: `Pay with USDT-BSC (BEP20)`
- Small note: `Do not close the payment page until the invoice is created.`

Simplified Chinese text:

- Title: `USDT-BSC (BEP20) 充值`
- Supporting text: `使用 USDT-BSC (BEP20) 支付；币安提现请选择 BSC / BNB Smart Chain (BEP20)，链上确认后自动到账。`
- Primary button: `使用 USDT-BSC (BEP20) 支付`
- Small note: `发票创建完成前请勿关闭页面。`

The component should follow the existing classic UI patterns and avoid large visual redesigns. It should not add a card inside another card if the existing wallet layout already provides a framed card container.

## Data Flow

The frontend sends:

```http
POST /payment/create
Content-Type: application/json

{
  "user_id": <currentUser.id>,
  "amount": 20
}
```

The payment bridge returns:

```json
{
  "success": true,
  "data": {
    "order_id": "np_...",
    "amount": 20,
    "currency": "USDTBSC",
    "invoice_url": "https://nowpayments.io/payment/?iid=...",
    "nowpayments_invoice_id": "..."
  }
}
```

On success, the frontend redirects with:

```js
window.location.href = data.invoice_url
```

On failure, the frontend displays an error toast and keeps the selected amount.

## User Identity

The frontend must use the existing New API logged-in user context. The user should not type or edit `user_id` in this native wallet flow.

This does not make `/payment/create` fully safe for public abuse by itself because a direct HTTP caller could still submit another user ID. That backend hardening is intentionally deferred but should be addressed before a broad public launch.

For the Stage 1 controlled test, the wallet page improvement is acceptable because users interact through the authenticated New API UI and the payment bridge still validates payment before crediting.

## Internationalization

Add strings to at least:

- `new-api-src/web/classic/src/i18n/locales/en.json`
- `new-api-src/web/classic/src/i18n/locales/zh-CN.json`
- `new-api-src/web/classic/src/i18n/locales/zh.json`

The implementation should use the existing `t(...)` translation helper used by the classic wallet components.

## Deployment

The testing server currently uses an official pinned New API image. This change requires a custom image built from `new-api-src`.

Deployment should:

1. Build the custom New API image.
2. Update the server environment to use that image.
3. Recreate only the `new-api` service if possible.
4. Keep MySQL, Redis, Caddy, and payment bridge data intact.
5. Verify `/console/topup`, `/payment/create`, `/payment/ipn`, and model calls after deployment.

## Acceptance Criteria

- Wallet management page loads normally.
- The NOWPayments recharge card appears in English when the UI language is English.
- The card appears in simplified Chinese when the UI language is Chinese.
- Selecting 10, 25, 50, or 100 updates the selected amount visibly.
- Clicking the pay button calls `/payment/create` with the current user's ID and selected amount.
- A successful response redirects to the NOWPayments invoice URL.
- A failed response shows a user-facing error without leaving the wallet page.
- Existing DeepSeek and Xiaomi MiMo channels still work after the custom image deploy.
- Existing simulated IPN test still credits exactly once.

## Risks

- Maintaining a custom New API image means future upstream New API updates need merge and rebuild work.
- The first implementation still relies on the frontend to send `user_id`; direct API hardening should follow.
- The temporary `sslip.io` hostname is suitable for testing but not for public launch.
