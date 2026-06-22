# Stage 1 Deployment

This deployment runs New API, MySQL, Redis, Caddy, and the payment bridge on Docker Compose. Promote changes in this order:

1. Local Mac with Docker Desktop for repeatable container validation.
2. Tencent Cloud Lighthouse staging for public HTTPS, NOWPayments webhook, restart, and backup testing.
3. Hetzner Cloud Singapore production after the full paid recharge flow passes staging.

Use separate hosts, DNS names, and `.env` files for staging and production. Do not copy staging secrets into production.

## Environments

- Local Mac: Docker Desktop, MySQL and Redis in Docker, local smoke checks before upload.
- Tencent Cloud Lighthouse staging: public webhook validation and deployment rehearsal.
- Hetzner Cloud Singapore production: Ubuntu 24.04 LTS, target 4 vCPU / 8 GB RAM for Stage 1.

## Image Pinning

`NEW_API_IMAGE` must be pinned before staging acceptance and production. Do not deploy `calciumion/new-api:latest` to production. Validate the image locally, promote it to Tencent Cloud staging, then keep the exact same digest for Hetzner production.

`deploy/.env.example` uses this digest-shaped placeholder:

```dotenv
NEW_API_IMAGE=calciumion/new-api@sha256:replace-with-validated-image-digest
```

After validating a candidate image, record the exact digest in the environment file for the target host.

## Initial Server Setup

Run on the Tencent Cloud staging server first, then repeat on the Hetzner production server.

```bash
apt update
apt upgrade -y
apt install -y ca-certificates curl git ufw rsync
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

## Upload From Local Mac

From `/Users/Admin/Desktop/api` on the Mac:

```bash
export SERVER_IP=203.0.113.10
rsync -az --delete \
  --exclude .git \
  --exclude deploy/.env \
  --exclude deploy/data \
  --exclude deploy/logs \
  --exclude node_modules \
  /Users/Admin/Desktop/api/ root@$SERVER_IP:/opt/api/
```

Use the Tencent Cloud server IP for staging. After staging acceptance, repeat the same upload to the Hetzner production server using the production IP.

## Configure Environment

```bash
ssh root@$SERVER_IP
cd /opt/api/deploy
cp .env.example .env
openssl rand -hex 32
```

Edit `.env` and set every `replace-with-*` value before starting services. Confirm these values are correct for the target environment:

- `APP_HOST`
- `EPUSDT_HOST`
- `PAYMENT_PUBLIC_BASE_URL`
- `NEW_API_IMAGE`
- `NEW_API_ADMIN_ACCESS_TOKEN`
- `NEW_API_ADMIN_USER_ID`
- `EPUSDT_API_BASE`
- `EPUSDT_PID`
- `EPUSDT_SECRET_KEY`
- MySQL, Redis, session, and crypto secrets

`EPUSDT_SECRET_KEY` must match the Epusdt merchant secret. The payment bridge should not start without it.

For a one-server sslip.io test deployment, keep New API and Epusdt on separate hostnames:

- `APP_HOST=204-168-215-163.sslip.io`
- `EPUSDT_HOST=pay.204-168-215-163.sslip.io`
- `PAYMENT_PUBLIC_BASE_URL=https://204-168-215-163.sslip.io`
- `EPUSDT_API_BASE=https://pay.204-168-215-163.sslip.io`

After Epusdt starts, open `https://$EPUSDT_HOST`, complete its setup, create or inspect the GMPay merchant, then copy the merchant `PID` and secret into `EPUSDT_PID` and `EPUSDT_SECRET_KEY`. Restart `payment-bridge` after changing those values.

## Start Or Update

```bash
cd /opt/api/deploy
docker compose pull
docker compose up -d --build
docker compose ps
docker compose logs -f new-api payment-bridge caddy
```

## New API Admin Setup

1. Open `https://$APP_HOST`.
2. Complete the first admin setup.
3. Configure provider channels for DeepSeek, Kimi / Moonshot, OpenAI, and Anthropic Claude API.
4. Create or copy a dedicated admin access token for the payment bridge.
5. Set `NEW_API_ADMIN_ACCESS_TOKEN` and `NEW_API_ADMIN_USER_ID` in `deploy/.env`.
6. Restart the payment bridge:

```bash
docker compose up -d payment-bridge
docker compose logs --since=5m payment-bridge
```

Keep provider names visible in model names or descriptions. Do not silently route one provider family to another.

## Smoke Checks

```bash
cd /opt/api/deploy
set -a
. ./.env
set +a
docker compose ps
curl -fsS "https://$APP_HOST/api/status"
curl -fsS "https://$APP_HOST/health/payment"
docker compose logs --since=10m payment-bridge
docker compose logs --since=10m new-api
```

Before production launch, complete a NOWPayments low-value live payment or sandbox-equivalent test on Tencent Cloud staging and verify the user is credited exactly once.

## Backup

```bash
cd /opt/api/deploy
docker compose exec -T mysql sh -c 'mysqldump -u root -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE"' > "backup-$(date +%F-%H%M%S).sql"
```

Copy backups off the server after creation. Test restore on staging before relying on the backup procedure for production.
