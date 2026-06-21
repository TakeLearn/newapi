# New API Wallet NOWPayments Top-Up Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a native USDT-TRC20 NOWPayments recharge entry to the New API classic wallet page and deploy it through a custom New API image.

**Architecture:** The wallet UI will call the existing same-origin `POST /payment/create` endpoint exposed by Caddy and backed by `payment-bridge`. A new focused React component will live beside existing top-up components and read the current user ID from the existing `userState` prop already passed into `RechargeCard`. Because `new-api-src/` is an ignored upstream checkout, New API source changes are committed to this repo as reproducible patch files under `patches/new-api/` and applied to a local or server checkout before building the custom image.

**Tech Stack:** New API classic React frontend, `@douyinfe/semi-ui`, existing i18next translation files, existing `API` axios helper, Docker Compose, custom New API Docker image built from `new-api-src`.

---

## File Map

- Modify: `new-api-src/web/classic/src/components/topup/RechargeCard.jsx`
  - Imports and renders the new NOWPayments card inside the existing wallet top-up content.
- Create: `new-api-src/web/classic/src/components/topup/NowPaymentsTopUpCard.jsx`
  - Owns amount selection, `/payment/create` call, loading state, and redirect behavior.
- Modify: `new-api-src/web/classic/src/i18n/locales/en.json`
  - Adds English strings for the card.
- Modify: `new-api-src/web/classic/src/i18n/locales/zh-CN.json`
  - Adds simplified Chinese strings for the card.
- Modify: `new-api-src/web/classic/src/i18n/locales/zh.json`
  - Adds simplified Chinese fallback strings for the card.
- Modify: `deploy/docker-compose.yml`
  - Changes `new-api` from image-only to buildable local source image for the custom deployment.
- Modify: `deploy/.env.example`
  - Documents the custom image value used by the Stage 1 testing deployment.
- Modify: `docs/operations/stage-1-runbook.md`
  - Adds the wallet top-up verification steps.
- Create: `patches/new-api/0001-wallet-nowpayments-topup.patch`
  - Portable patch containing all New API source changes.
- Create: `scripts/apply-new-api-patches.sh`
  - Applies the tracked patches to `new-api-src/` locally or on the server.

## Task 1: Add NOWPayments Wallet Component

**Files:**
- Create: `new-api-src/web/classic/src/components/topup/NowPaymentsTopUpCard.jsx`

- [ ] **Step 1: Create the component file**

Create `new-api-src/web/classic/src/components/topup/NowPaymentsTopUpCard.jsx`:

```jsx
/*
Copyright (C) 2025 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/

import React, { useMemo, useState } from 'react';
import { Banner, Button, Card, Space, Typography } from '@douyinfe/semi-ui';
import { WalletCards } from 'lucide-react';
import { API } from '../../helpers/api';
import { showError, showSuccess } from '../../helpers';

const { Text, Title } = Typography;

const TOP_UP_AMOUNTS = [20, 30, 50, 100];

const NowPaymentsTopUpCard = ({ t, userId }) => {
  const [selectedAmount, setSelectedAmount] = useState(TOP_UP_AMOUNTS[0]);
  const [loading, setLoading] = useState(false);

  const amountButtons = useMemo(
    () =>
      TOP_UP_AMOUNTS.map((amount) => (
        <Button
          key={amount}
          type={selectedAmount === amount ? 'primary' : 'tertiary'}
          theme={selectedAmount === amount ? 'solid' : 'light'}
          onClick={() => setSelectedAmount(amount)}
          disabled={loading}
        >
          ${amount}
        </Button>
      )),
    [loading, selectedAmount],
  );

  const createInvoice = async () => {
    if (!userId) {
      showError(t('Unable to identify the current user. Please refresh and try again.'));
      return;
    }

    setLoading(true);
    try {
      const response = await API.post(
        '/payment/create',
        {
          user_id: userId,
          amount: selectedAmount,
        },
        {
          skipErrorHandler: true,
        },
      );

      if (!response.data?.success || !response.data?.data?.invoice_url) {
        throw new Error(response.data?.message || t('Unable to create payment invoice.'));
      }

      showSuccess(t('Redirecting to NOWPayments...'));
      window.location.href = response.data.data.invoice_url;
    } catch (error) {
      showError(
        error?.response?.data?.message ||
          error?.message ||
          t('Unable to create payment invoice.'),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className='!rounded-xl w-full'>
      <Space vertical align='start' style={{ width: '100%' }} spacing='medium'>
        <div className='flex items-start justify-between w-full gap-3'>
          <div>
            <Space spacing='tight' align='center'>
              <WalletCards size={18} />
              <Title heading={5} style={{ margin: 0 }}>
                {t('USDT-TRC20 Top-up')}
              </Title>
            </Space>
            <Text type='secondary'>
              {t('Pay with USDT-TRC20. Credits are added after network confirmation.')}
            </Text>
          </div>
        </div>

        <Space wrap>{amountButtons}</Space>

        <Button
          type='primary'
          theme='solid'
          loading={loading}
          disabled={loading}
          onClick={createInvoice}
        >
          {t('Pay with USDT-TRC20')}
        </Button>

        <Banner
          type='info'
          description={t('Do not close the payment page until the invoice is created.')}
          fullMode={false}
        />
      </Space>
    </Card>
  );
};

export default NowPaymentsTopUpCard;
```

- [ ] **Step 2: Run a focused frontend syntax check**

Run:

```bash
cd new-api-src/web/classic
bun run build
```

Expected: build may take several minutes; it should complete without JSX syntax errors. If dependencies are missing locally, run the full Docker build in Task 6 instead.

- [ ] **Step 3: Leave source change uncommitted in upstream checkout**

```bash
cd new-api-src
git status --short
```

Expected: the new file appears in the upstream checkout. Do not commit inside `new-api-src`; Task 4 creates and commits a root-repo patch file instead.

## Task 2: Render The Card On Wallet Page

**Files:**
- Modify: `new-api-src/web/classic/src/components/topup/RechargeCard.jsx`

- [ ] **Step 1: Import the component**

In `new-api-src/web/classic/src/components/topup/RechargeCard.jsx`, add this import near the existing top-up imports:

```jsx
import NowPaymentsTopUpCard from './NowPaymentsTopUpCard';
```

- [ ] **Step 2: Render the component inside the top-up content**

In `RechargeCard.jsx`, inside the `topupContent` vertical `<Space>` and after the account statistics card section begins, render the new card before the existing online recharge form:

```jsx
      <NowPaymentsTopUpCard t={t} userId={userState?.user?.id} />
```

The final structure should keep the card inside the existing vertical layout so it inherits wallet page spacing and responsiveness.

- [ ] **Step 3: Build to catch import and prop errors**

Run:

```bash
cd new-api-src/web/classic
bun run build
```

Expected: PASS with no `NowPaymentsTopUpCard` import errors.

- [ ] **Step 4: Leave source change uncommitted in upstream checkout**

```bash
cd new-api-src
git status --short
```

Expected: `RechargeCard.jsx` and the new card file appear in the upstream checkout. Do not commit inside `new-api-src`; Task 4 creates and commits a root-repo patch file instead.

## Task 3: Add English And Chinese Translations

**Files:**
- Modify: `new-api-src/web/classic/src/i18n/locales/en.json`
- Modify: `new-api-src/web/classic/src/i18n/locales/zh-CN.json`
- Modify: `new-api-src/web/classic/src/i18n/locales/zh.json`

- [ ] **Step 1: Add English strings**

Add these key-value pairs to `new-api-src/web/classic/src/i18n/locales/en.json`:

```json
{
  "USDT-TRC20 Top-up": "USDT-TRC20 Top-up",
  "Pay with USDT-TRC20. Credits are added after network confirmation.": "Pay with USDT-TRC20. Credits are added after network confirmation.",
  "Pay with USDT-TRC20": "Pay with USDT-TRC20",
  "Do not close the payment page until the invoice is created.": "Do not close the payment page until the invoice is created.",
  "Unable to identify the current user. Please refresh and try again.": "Unable to identify the current user. Please refresh and try again.",
  "Unable to create payment invoice.": "Unable to create payment invoice.",
  "Redirecting to NOWPayments...": "Redirecting to NOWPayments..."
}
```

Preserve valid JSON syntax and the file's existing ordering style.

- [ ] **Step 2: Add simplified Chinese strings**

Add these key-value pairs to both `new-api-src/web/classic/src/i18n/locales/zh-CN.json` and `new-api-src/web/classic/src/i18n/locales/zh.json`:

```json
{
  "USDT-TRC20 Top-up": "USDT-TRC20 充值",
  "Pay with USDT-TRC20. Credits are added after network confirmation.": "使用 USDT-TRC20 支付，链上确认后自动到账。",
  "Pay with USDT-TRC20": "使用 USDT-TRC20 支付",
  "Do not close the payment page until the invoice is created.": "发票创建完成前请勿关闭页面。",
  "Unable to identify the current user. Please refresh and try again.": "无法识别当前用户，请刷新后重试。",
  "Unable to create payment invoice.": "无法创建支付发票。",
  "Redirecting to NOWPayments...": "正在跳转到 NOWPayments..."
}
```

- [ ] **Step 3: Validate JSON**

Run:

```bash
node -e "for (const f of ['new-api-src/web/classic/src/i18n/locales/en.json','new-api-src/web/classic/src/i18n/locales/zh-CN.json','new-api-src/web/classic/src/i18n/locales/zh.json']) JSON.parse(require('fs').readFileSync(f, 'utf8')); console.log('i18n json ok')"
```

Expected:

```text
i18n json ok
```

- [ ] **Step 4: Leave source change uncommitted in upstream checkout**

```bash
cd new-api-src
git status --short
```

Expected: the three locale files appear in the upstream checkout. Do not commit inside `new-api-src`; Task 4 creates and commits a root-repo patch file instead.

## Task 4: Create Patch Workflow And Configure Custom New API Image Build

**Files:**
- Create: `patches/new-api/0001-wallet-nowpayments-topup.patch`
- Create: `scripts/apply-new-api-patches.sh`
- Modify: `deploy/docker-compose.yml`
- Modify: `deploy/.env.example`

- [ ] **Step 1: Create patch directory**

Run:

```bash
mkdir -p patches/new-api
```

- [ ] **Step 2: Generate the New API source patch**

Run:

```bash
cd new-api-src
git diff --binary -- web/classic/src/components/topup/RechargeCard.jsx web/classic/src/i18n/locales/en.json web/classic/src/i18n/locales/zh-CN.json web/classic/src/i18n/locales/zh.json > ../patches/new-api/0001-wallet-nowpayments-topup.patch
git diff --binary --cached -- web/classic/src/components/topup/NowPaymentsTopUpCard.jsx >> ../patches/new-api/0001-wallet-nowpayments-topup.patch
```

If the new component is still untracked, add it temporarily to the upstream index before generating the second diff:

```bash
cd new-api-src
git add web/classic/src/components/topup/NowPaymentsTopUpCard.jsx
git diff --binary --cached -- web/classic/src/components/topup/NowPaymentsTopUpCard.jsx >> ../patches/new-api/0001-wallet-nowpayments-topup.patch
git reset -- web/classic/src/components/topup/NowPaymentsTopUpCard.jsx
```

Expected: `patches/new-api/0001-wallet-nowpayments-topup.patch` contains changes for the new component, `RechargeCard.jsx`, and locale files.

- [ ] **Step 3: Create patch apply script**

Create `scripts/apply-new-api-patches.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NEW_API_DIR="${NEW_API_DIR:-$ROOT_DIR/new-api-src}"
PATCH_DIR="$ROOT_DIR/patches/new-api"

if ! git -C "$NEW_API_DIR" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "New API checkout not found at $NEW_API_DIR" >&2
  echo "Clone https://github.com/QuantumNous/new-api.git into new-api-src first." >&2
  exit 1
fi

cd "$NEW_API_DIR"

for patch in "$PATCH_DIR"/*.patch; do
  [[ -e "$patch" ]] || continue
  echo "Applying $(basename "$patch")"
  if git apply --check "$patch" >/dev/null 2>&1; then
    git apply --3way "$patch"
  elif git apply --reverse --check "$patch" >/dev/null 2>&1; then
    echo "Skipping $(basename "$patch"); already applied"
  else
    git apply --3way "$patch"
  fi
done
```

Make it executable:

```bash
chmod +x scripts/apply-new-api-patches.sh
```

- [ ] **Step 4: Make `new-api` buildable from local source**

In `deploy/docker-compose.yml`, change the `new-api` service from:

```yaml
  new-api:
    image: ${NEW_API_IMAGE}
```

to:

```yaml
  new-api:
    build:
      context: ../new-api-src
      dockerfile: ../deploy/Dockerfile.new-api-local
    image: ${NEW_API_IMAGE}
```

This preserves the image name while allowing `docker compose build new-api` to build the custom source image.

- [ ] **Step 5: Update environment example**

In `deploy/.env.example`, change:

```dotenv
NEW_API_IMAGE=calciumion/new-api@sha256:8979ca863c28e7b0b00f5014e1bead6866ff0bc24d68597f23186fd1e6b3b913
```

to:

```dotenv
NEW_API_IMAGE=new-api-stage1-custom:wallet-nowpayments
```

Add this comment directly above it:

```dotenv
# Custom Stage 1 image built from ../new-api-src by deploy/docker-compose.yml.
# To deploy an upstream pinned image without local source modifications, remove or override the new-api build block too.
```

- [ ] **Step 6: Validate compose config**

Run:

```bash
cd deploy
docker compose config >/tmp/newapi-compose-config.out
tail -20 /tmp/newapi-compose-config.out
```

Expected: command exits 0 and includes `new-api-stage1-custom:wallet-nowpayments` when `.env` has the same value.

- [ ] **Step 7: Commit**

```bash
git add patches/new-api/0001-wallet-nowpayments-topup.patch scripts/apply-new-api-patches.sh deploy/docker-compose.yml deploy/.env.example
git commit -m "chore: add new api wallet topup patch workflow"
```

## Task 5: Update Runbook

**Files:**
- Modify: `docs/operations/stage-1-runbook.md`

- [ ] **Step 1: Add wallet verification section**

Append this section before `## Backup`:

````markdown
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

- The USDT-TRC20 top-up card appears.
- The UI follows the selected language.
- Amount buttons show 20, 30, 50, and 100.
- Clicking the payment button creates a NOWPayments invoice.
- The browser redirects to the invoice URL.

Do not treat the browser return URL as proof of payment. Confirm crediting only through `payment_orders` and user quota after NOWPayments IPN arrives.
````

- [ ] **Step 2: Commit**

```bash
git add docs/operations/stage-1-runbook.md
git commit -m "docs: add wallet topup verification"
```

## Task 6: Build And Verify Locally

**Files:**
- No source changes expected.

- [ ] **Step 1: Build the custom image locally**

Run:

```bash
./scripts/apply-new-api-patches.sh
cd deploy
docker compose build new-api
```

Expected: Docker builds `new-api-stage1-custom:wallet-nowpayments` using `deploy/Dockerfile.new-api-local`.

- [ ] **Step 2: Start local source stack**

Run:

```bash
cd deploy
docker compose -f docker-compose.local-source.yml up -d --build
docker compose -f docker-compose.local-source.yml ps
```

Expected: `new-api-source`, MySQL, Redis, and payment bridge containers are running or healthy.

- [ ] **Step 3: Browser check**

Open:

```text
http://localhost:3000/console/topup
```

Expected: wallet page loads and the USDT-TRC20 top-up card appears. If login is required, log in with the local test admin created during previous local setup.

- [ ] **Step 4: Payment bridge check**

Run:

```bash
curl -fsS http://127.0.0.1:8080/health
```

Expected:

```json
{"success":true,"service":"payment-bridge"}
```

## Task 7: Deploy To Test Server

**Files:**
- No source changes expected.

- [ ] **Step 1: Push the branch**

Run locally:

```bash
git status --short --branch
git push origin stage-1-local-mvp
```

Expected: branch pushes cleanly and no commits remain ahead locally.

- [ ] **Step 2: Pull on server**

Run on the server:

```bash
cd /opt/api
git pull --ff-only
git -C new-api-src rev-parse --is-inside-work-tree >/dev/null 2>&1 || git clone https://github.com/QuantumNous/new-api.git new-api-src
./scripts/apply-new-api-patches.sh
git log --oneline --max-count=5
```

Expected: latest root repo commits include the wallet top-up patch workflow and docs commits. `new-api-src` has the patch applied.

- [ ] **Step 3: Set custom image name**

Run on the server:

```bash
cd /opt/api/deploy
unset NEW_API_IMAGE
sed -i "s|^NEW_API_IMAGE=.*|NEW_API_IMAGE=new-api-stage1-custom:wallet-nowpayments|" .env
grep '^NEW_API_IMAGE=' .env
```

Expected:

```text
NEW_API_IMAGE=new-api-stage1-custom:wallet-nowpayments
```

- [ ] **Step 4: Build and recreate only New API**

Run on the server:

```bash
cd /opt/api/deploy
for k in $(sed -n 's/^\([A-Za-z_][A-Za-z0-9_]*\)=.*/\1/p' .env); do unset "$k"; done
set -a
. ./.env
set +a
docker compose build new-api
docker compose up -d --no-deps --force-recreate new-api
docker compose ps
```

Expected: `new-api` is recreated with the custom image and becomes healthy. MySQL and Redis volumes remain intact.

- [ ] **Step 5: Verify HTTPS and wallet page**

Run on the server:

```bash
curl -fsS "https://$APP_HOST/api/status"
curl -fsS "https://$APP_HOST/health/payment"
```

Open:

```text
https://204-168-215-163.sslip.io/console/topup
```

Expected: the wallet page shows the USDT-TRC20 top-up card.

## Task 8: Acceptance Test

**Files:**
- No source changes expected.

- [ ] **Step 1: Test invoice creation from UI**

In the browser:

1. Open `https://204-168-215-163.sslip.io/console/topup`.
2. Select `$10`.
3. Click `Pay with USDT-TRC20`.

Expected: browser redirects to a NOWPayments invoice. Do not pay if you do not want to spend 10 USDT.

- [ ] **Step 2: Verify order was created**

Run on the server:

```bash
cd /opt/api/deploy
set -a
. ./.env
set +a
docker compose exec -T mysql mysql -u root -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE" \
  -e "SELECT id,user_id,amount_usd,quota_to_add,status,nowpayments_invoice_id,created_at FROM payment_orders ORDER BY created_at DESC LIMIT 5;"
```

Expected: latest row has the browser user's ID, amount 10, currency path through NOWPayments, and status `pending`.

- [ ] **Step 3: Re-run simulated IPN exactly-once check**

Run the existing simulated IPN flow from the Stage 1 runbook against a fresh simulated order.

Expected:

- First valid IPN returns `{"success":true,"data":{"credited":true}}`.
- Duplicate valid IPN returns `{"success":true,"data":{"credited":false}}`.
- User quota increases once.

- [ ] **Step 4: Test provider continuity**

Use New API channel tests or a user token to call:

```text
deepseek-v4-flash
mimo-v2.5-pro
```

Expected: both still return successful test responses after the custom image deploy.
