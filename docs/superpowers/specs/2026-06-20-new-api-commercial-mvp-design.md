# New API Commercial MVP Design

## Goal

Launch the fastest possible commercial MVP for an international LLM API relay service. The first release must prove the business loop:

1. A user registers.
2. The user pays with USDT.
3. The payment is credited automatically.
4. The user creates an API key.
5. The user calls supported model APIs.
6. Usage is metered and deducted from the user's balance.

This stage uses New API as the operational base instead of building a custom gateway from scratch.

## Scope

### In Scope

- Deploy New API on one Hetzner VPS.
- Use Docker Compose for all services.
- Use MySQL 8 as the main database.
- Use Redis for cache, queue, and rate-limit support where New API supports it.
- Use Caddy for HTTPS and reverse proxy.
- Use a temporary HTTPS domain until a formal brand domain is purchased.
- Add a small payment bridge for NOWPayments.
- Accept only USDT-TRC20 in the first release.
- Support fixed recharge amounts: 10, 25, 50, and 100 USDT.
- Credit users at 1 USDT = 1 USD credit.
- Configure provider channels for DeepSeek, Kimi/Moonshot, OpenAI, and Anthropic Claude API.
- Enable basic user, key, and channel controls in New API.
- Apply basic rate limits and manual abuse controls.
- Use English-facing UI text where it affects the first user journey.

### Out Of Scope

- Stripe, credit cards, or subscriptions.
- Full custom website, docs portal, public status page, terms, privacy page, and ticketing system.
- Multi-region routing.
- Kubernetes.
- Fully custom billing, routing, logging, and abuse systems.
- Supporting arbitrary crypto assets or networks.
- Selling access to Claude Code as a tool. The provider is Anthropic Claude API.

## Infrastructure

Stage 1 uses three environments before public launch:

```text
Local Mac
  -> Tencent Cloud Lighthouse staging server
  -> Hetzner Singapore production server
```

Local Mac is used for development and repeatable Docker Compose validation. MySQL and Redis run in Docker locally, not as native Mac services. Tencent Cloud Lighthouse is used as a public staging server for HTTPS, webhook, restart, backup, and deployment testing. Hetzner Singapore is the production server once the full business loop passes staging.

The production server will be:

- Provider: Hetzner Cloud
- Region: Singapore
- Size: 4 vCPU / 8 GB RAM
- OS: Ubuntu 24.04 LTS
- Runtime: Docker Compose

The deployment topology is:

```text
Temporary HTTPS domain
  -> Caddy
    -> New API
    -> Payment bridge
    -> MySQL 8
    -> Redis
```

Cloudflare is deferred until the formal domain is purchased. Once the formal domain exists, it should sit in front of Caddy for DNS, proxying, WAF, bot protection, and basic DDoS protection.

The New API Docker image must not remain on `latest` for production. The implementation should first validate a current image locally and on staging, then pin production to a specific tag or image digest.

## Payment Flow

NOWPayments is the payment processor for Stage 1.

Supported payment method:

- Asset: USDT
- Network: TRC20
- Recharge amounts: 10, 25, 50, 100 USDT
- Credit conversion: 1 USDT = 1 USD credit

Flow:

1. The user selects a fixed recharge amount.
2. The payment bridge creates a NOWPayments invoice or payment.
3. The user pays USDT-TRC20.
4. NOWPayments sends an IPN webhook to the payment bridge.
5. The bridge verifies the IPN signature, payment identity, status, expected amount, and currency.
6. The bridge marks the order paid only after an accepted final status.
7. The bridge credits the corresponding New API user balance.
8. The bridge stores the payment record and prevents duplicate crediting.

Important payment rules:

- Frontend return URLs are never trusted as payment proof.
- Webhook/IPN is the only source of truth.
- Each NOWPayments invoice or payment ID can credit balance only once.
- Underpaid orders do not auto-credit.
- Overpaid orders credit only the fixed order amount in Stage 1; any excess is handled manually.
- Manual admin correction must be possible through database or New API admin operations.

## Provider Channels

Stage 1 supports four provider families:

- DeepSeek
- Kimi/Moonshot
- OpenAI
- Anthropic Claude API

Provider positioning:

- DeepSeek: low-cost primary model family.
- Kimi/Moonshot: low-cost and long-context supplement.
- OpenAI: international trust and high-quality model family.
- Anthropic Claude API: high-quality model family.

The user-facing model list should identify the provider clearly enough that users know where their traffic is routed. Silent substitution between provider families is not allowed in Stage 1.

## User Journey

The first user journey is:

1. User registers or is created by an admin.
2. User opens the recharge page.
3. User chooses a fixed USDT amount.
4. User pays the NOWPayments invoice.
5. Balance is credited after webhook confirmation.
6. User creates an API key in New API.
7. User calls an OpenAI-compatible endpoint.
8. User sees usage and balance deduction.

The MVP can use New API's existing screens where possible. Only the minimum English copy and payment entry points need to be adjusted for Stage 1.

## Abuse Controls

Stage 1 uses simple controls that can be operated manually:

- New users start with conservative RPM, TPM, and concurrency limits.
- Expensive providers and models have stricter default limits.
- Each API key can be disabled.
- Each user can be frozen or disabled.
- Each provider channel can be disabled.
- Logs should avoid storing full prompts by default where configurable.
- Admins monitor unusual patterns manually at first: new-user bursts, high failure rates, long-context drains, repeated insufficient-balance attempts, and repeated signups from similar network sources.

The system should not offer unlimited plans in Stage 1. Prepaid credits are safer for cost control.

## Operational Checks

The MVP is ready when these checks pass:

- New API is reachable over HTTPS.
- MySQL persists data after container restart.
- Redis starts successfully and is reachable by New API if configured.
- Admin login works.
- A test user can be created.
- A test user can create an API key.
- A test DeepSeek request succeeds.
- A test Kimi/Moonshot request succeeds.
- A test OpenAI request succeeds.
- A test Anthropic Claude request succeeds.
- A NOWPayments test or low-value live USDT payment creates an order.
- The IPN webhook credits the correct user exactly once.
- The credited user can spend balance through model calls.
- Usage appears in New API logs.
- Balance decreases after usage.
- An admin can disable the test user's API key.
- An admin can disable a provider channel.

## Later Stages

Stage 2 adds trust assets:

- Formal brand domain.
- Cloudflare.
- Public landing page.
- Public documentation.
- Model and pricing page.
- Status page.
- Terms of service.
- Privacy policy.
- Support or ticketing flow.

Stage 3 reduces dependence on New API:

- Custom billing ledger.
- Custom provider router.
- Custom usage logs and privacy controls.
- Custom abuse detection.
- Multi-region or multi-node deployment if demand justifies it.

## Decisions

- The first implementation path is Scheme A: deploy New API mostly as-is and add only the payment bridge needed for USDT recharge.
- The rollout path is Local Mac, then Tencent Cloud staging, then Hetzner Singapore production.
- The first region is Hetzner Singapore.
- The first server size is 4 vCPU / 8 GB RAM.
- The first database is MySQL 8.
- The first payment processor is NOWPayments.
- The only first payment asset is USDT-TRC20.
- The first provider set is DeepSeek, Kimi/Moonshot, OpenAI, and Anthropic Claude API.
- The production New API image will be pinned after local and staging validation.
