# Local Source Debug Environment

This environment runs New API from the upstream source checkout in `new-api-src/`, plus a local MySQL, Redis, and payment bridge.

## Services

- New API source build: http://localhost:3000
- Payment bridge: http://localhost:8080/health
- MySQL: `127.0.0.1:3308`
- Redis: `127.0.0.1:6381`

It intentionally uses ports `3308` and `6381` to avoid the existing local `pingdou-mysql` and `pingdou-redis` containers.

## Start

```bash
cd deploy
docker compose -f docker-compose.local-source.yml up -d --build
```

The first build compiles New API from `new-api-src/`. The local Dockerfile uses `GOPROXY=https://goproxy.cn,direct` so Go module download works reliably from China.

## Check

```bash
curl http://127.0.0.1:3000/api/status
curl http://127.0.0.1:8080/health
docker compose -f docker-compose.local-source.yml ps
```

On a fresh database, New API returns `setup:false`. Open http://localhost:3000 and create the root admin account.

## Stop

```bash
cd deploy
docker compose -f docker-compose.local-source.yml down
```

## Reset Local Data

This deletes the local debug database and Redis data:

```bash
cd deploy
docker compose -f docker-compose.local-source.yml down -v
```

## Rebuild After New API Source Changes

```bash
cd deploy
docker compose -f docker-compose.local-source.yml up -d --build new-api-source
```

## Payment Bridge Notes

`payment-bridge-local` starts with placeholder NOWPayments and New API admin token values so health checks and migrations work locally. Before testing real recharge crediting, create the New API admin account, generate a dedicated admin access token, then replace `NEW_API_ADMIN_ACCESS_TOKEN` in `deploy/docker-compose.local-source.yml` or override it with a local env file.
