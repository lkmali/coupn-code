# Integration Solution

A multi-tenant backend + admin dashboard for clinics/organizations. It bundles **authentication & RBAC**, **Stripe payments** (one-time, checkout, subscriptions, Connect payouts), **WhatsApp/Instagram messaging** (Meta), **Exotel VoIP calling**, **AWS S3/SES**, and an **MCP server** for AI agents — all backed by MongoDB and served behind a Next.js admin UI.

- **Backend**: TypeScript + Express via [`routing-controllers`](https://github.com/typestack/routing-controllers), MongoDB (Mongoose), Redis (optional), Swagger at `/docs`.
- **Frontend** (`UI/`): Next.js 16 (app router) + Redux Toolkit + Axios + Stripe.js.
- **Entry point**: [src/index.ts](src/index.ts) boots Express on `PORT` (default 3000/4000), mounts all controllers under `/api`, connects Mongo, runs migrations, and serves the compiled UI from `UI/out`.

> **Stripe setup walkthrough** (account, keys, webhooks, payment methods, Connect, Identity, Radar): see [Stripe Payments → How to register on Stripe](#how-to-register-on-stripe-one-time) below.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Architecture](#architecture)
3. [Login & User Configuration](#login--user-configuration)
4. [Stripe Payments](#stripe-payments) — how to register on Stripe & what we built
5. [Data Models](#data-models)
6. [Frontend (Admin UI)](#frontend-admin-ui)
7. [Environment Variables](#environment-variables)

---

## Quick Start

```bash
# 1. Install dependencies (root + workspaces)
npm install

# 2. Configure environment
cp .env.example .env        # fill in MONGO_URI, JWT secrets, AWS, STRIPE_SECRETS_KEY, ...

# 3. Run backend + TS watch (dev)
npm run dev                 # tsc --watch + nodemon dist/src/index.js

# 4. Build everything for production
npm run build               # build:ui (Next.js export) + build:server (tsc)
npm start                   # compile + node dist/src/index.js
```

Requires: **Node.js**, **MongoDB** (`MONGO_URI`), and optionally **Redis** (`USE_REDIS=true`).
Health check: `GET /health`. API docs: `GET /docs` (Swagger UI).

---

## Architecture

```
intgration-solution/
├── src/
│   ├── index.ts                  # Express bootstrap, middleware, controller loading
│   ├── config.ts                 # env parsing & typed config
│   ├── controllers/              # routing-controllers HTTP routes (@Get/@Post/...)
│   ├── service/                  # business logic
│   │   └── stripe/               # Stripe: client, config, payment, checkout,
│   │                             #   subscription, invoice, connect
│   ├── database/mongo/
│   │   ├── models/               # Mongoose schemas
│   │   └── repository/           # data-access layer
│   ├── dto/                      # request DTOs + class-validator rules
│   ├── strategies/               # auth strategies (jwt/basic/otp/email/webhook)
│   ├── decorators/               # @Authentication, @Authorize, @CurrentUser
│   ├── middlewares/ middleware/  # auth, error handling, rate limit, timezone
│   ├── mcp/                      # Model Context Protocol server (AI agent tools)
│   └── typings/                  # shared types/interfaces
└── UI/                           # Next.js admin dashboard (app router + Redux Toolkit)
```

**Request pipeline**: trust-proxy → request context → request logger → timezone → Helmet → CORS → rate limiting (orders/payments) → body parsing (with **raw body captured** for webhook signature verification) → controller (`@Authentication` strategy → `@Authorize` RBAC → handler).

**External integrations**: Stripe, AWS S3/SES, Meta (WhatsApp/Instagram), Exotel (VoIP), OpenAI/Gemini, Google OAuth. Per-organization secrets (Stripe keys, Meta tokens, Exotel creds) are stored **encrypted** in `OrganizationConfiguration` via `EncryptionService`.

---

## Login & User Configuration

Authentication is **strategy-based** and declared per route with the `@Authentication(...)` decorator; role gating uses `@Authorize([Role.ADMIN, ...])`. Tokens are **stateless JWTs** ([src/service/jwt.service.ts](src/service/jwt.service.ts)) signed with issuer/audience/algorithm from env.

### Auth strategies ([src/strategies/](src/strategies/))

| Strategy | Used by | How it authenticates |
|----------|---------|----------------------|
| `BASIC_AUTH` | `POST /api/auth/login` | `Authorization: Basic base64(email:password)` → bcrypt compare |
| `OTP_AUTH` | `POST /api/auth/verify-otp` | mobile + 6-digit OTP verified against the `tokens` collection (TTL) |
| `EMAIL_AUTH` | `POST /api/auth/email/password/set` | email + encrypted OTP from the reset link |
| `JWT_AUTH` | most routes | `Authorization: Bearer <jwt>` verified by `JWTService` |
| `NO_AUTH` | `send-otp`, `password/link`, publishable-key | public |

### Users, roles & permissions (RBAC)

- **Roles** (system-wide): `ADMIN`, `RECEPTIONIST`, `USER`, `PATIENT`.
- **Permissions**: granular codes (e.g. `VIEW_PATIENTS`, `MANAGE_APPOINTMENTS`) joined to roles via `RolePermission`, with per-user overrides via `UserPermission`.
- Admins create users, update profiles, and activate/deactivate accounts. The primary admin cannot be deactivated, and non-admins cannot be granted the ADMIN role.

> Frontend stores the JWT in `localStorage` (`app.token`) and attaches `Authorization: Bearer <token>` to every request. A `401` clears the session and redirects to `/login`. See [UI/lib/api.ts](UI/lib/api.ts).

---

## Stripe Payments

When you open **Payments** in the admin UI you can configure Stripe, manage a product catalog, and run live test payments through two flows. Here's how to get set up and what's been built.

### How to register on Stripe (one-time)

> Step-by-step with the exact dashboard paths and the full list of webhook events to subscribe to:

1. **Create a Stripe account** and complete the business profile, bank account, and tax info, then **activate** it.
2. **Get API keys** — Dashboard → *Developers → API Keys*. Copy the **Publishable key** (`pk_test_…`/`pk_live_…`) and **Secret key** (`sk_test_…`/`sk_live_…`). The secret key never goes to the browser.
3. **Add a webhook endpoint** — Dashboard → *Developers → Webhooks* → point it at:
   ```
   POST https://<your-api-domain>/api/webhook/stripe/<orgId>
   ```
   Subscribe to the events we handle (see table below), then copy the **Signing secret** (`whsec_…`).
4. **Enable payment methods** — *Settings → Payment Methods*. Leave **dynamic payment methods** on (cards, wallets, UPI, etc.); don't hardcode `card`.
5. **Enter the keys in the app** — open **Payments → Stripe settings** (admin only). Paste the publishable key, secret key, webhook secret, and default currency, then enable payments.
   - These are **encrypted at rest** with `STRIPE_SECRETS_KEY` and stored per-organization in `OrganizationConfiguration.stripeConfiguration` — secrets are never returned to the browser (the config view is masked).
6. **(Local testing)** use the Stripe CLI: `stripe listen --forward-to localhost:3000/api/webhook/stripe/<orgId>` and `stripe trigger payment_intent.succeeded`.

### What we've built

Per-organization Stripe support (each org brings its own keys). Service code lives in [src/service/stripe/](src/service/stripe/):

| Feature | Status | Where |
|---------|--------|-------|
| **Payment Intents** (in-page card payments) | ✅ | [payment.service.ts](src/service/stripe/payment.service.ts) |
| **Hosted Checkout Sessions** (redirect) | ✅ | [checkout.service.ts](src/service/stripe/checkout.service.ts) |
| **Refunds** (admin, idempotent) | ✅ | payment.service.ts |
| **Subscriptions** (create, list, cancel, billing portal) | ✅ | [subscription.service.ts](src/service/stripe/subscription.service.ts) |
| **Invoices** (recurring billing reconciliation) | ✅ | [invoice.service.ts](src/service/stripe/invoice.service.ts) |
| **Stripe Connect** (connected accounts, payouts/transfers) | ✅ infra | [connect.service.ts](src/service/stripe/connect.service.ts) |
| **Dynamic payment methods** (`automatic_payment_methods`) | ✅ | checkout/payment services |
| **Encrypted per-org config** + masked config view | ✅ | [stripeConfig.service.ts](src/service/stripe/stripeConfig.service.ts) |
| **Webhook signature verification** + multi-tenant routing | ✅ | [stripe.webhook.strategy.ts](src/strategies/stripe.webhook.strategy.ts) |
| **Idempotency keys** on intent/checkout creation | ✅ | per-order keys (`order_<id>`) |
| Stripe **Identity / Radar / automatic Tax** | ⏳ planned | dashboard-enabled; not yet coded |

### Payment flows (UI)

- **Elements (in-page)**: create order → `create-intent` → `<CardElement>` → `stripe.confirmCardPayment(clientSecret)` → poll `GET /orders/:id` until the webhook marks it `PAID`.
- **Hosted Checkout**: create order → `create-checkout-session` → redirect to Stripe → return to `/payments?checkout=success` → poll order status.

**The webhook is the source of truth** — the frontend never marks an order paid; it polls until the backend processes the Stripe event. See [UI/app/(protected)/payments/page.tsx](UI/app/(protected)/payments/page.tsx) and [UI/components/payments/](UI/components/payments/).

### Webhook events handled

Endpoint: `POST /api/webhook/stripe/:orgId` (`STRIPE_WEBHOOK` strategy). Handlers in [payment.service.ts](src/service/stripe/payment.service.ts) `processWebhookEvent()` — all **idempotent** (upsert by Stripe ID):

| Event | Effect |
|-------|--------|
| `payment_intent.succeeded` | Order → `PAID`, payment record SUCCEEDED |
| `payment_intent.payment_failed` | Order → `FAILED` |
| `charge.refunded` | Order → `REFUNDED`, record refund amount |
| `checkout.session.completed` | Resolve order via metadata → `PAID` |
| `customer.subscription.created/updated` | Upsert local subscription mirror |
| `customer.subscription.deleted` | Subscription → `CANCELED` |
| `invoice.paid` / `invoice.payment_failed` | Record recurring charge result |
| `account.updated` | Sync connected-account capabilities |
| `payout.paid` / `payout.failed` | Record payout status / failure reason |

---

## Data Models

MongoDB / Mongoose ([src/database/mongo/models/](src/database/mongo/models/)):

| Domain | Models |
|--------|--------|
| **Identity** | `user`, `organization`, `role`, `permission`, `rolePermission`, `userPermission`, `password`, `token` |
| **Commerce** | `product`, `order`, `payment`, `subscription`, `invoice`, `payout`, `connectedAccount` |
| **Config** | `organizationConfiguration` (encrypted Stripe/Meta/Exotel/AI settings) |
| **Messaging** | `socialContact`, `socialMessage` |
| **Ops** | `auditLog`, `s3TempKey` |

Key commerce fields: orders/payments track `paymentIntentId`, `checkoutSessionId`, `chargeId`, `amount`/`amountRefunded`, `currency`, and a `status` enum; each payment stores a full `stripeResponse` snapshot for audit and reconciliation.

---

## Frontend (Admin UI)

`UI/` — Next.js 16 (app router), React 19, Redux Toolkit, Axios, Tailwind 4, `@stripe/react-stripe-js`.

| Route | Access | Purpose |
|-------|--------|---------|
| `/login`, `/forgot-password`, `/account/set-password` | public | Auth |
| `/` | auth | Dashboard |
| `/profile` | auth | Own profile |
| `/payments` | auth | Stripe config, products, checkout demo (Elements + hosted) |
| `/orders` | auth | Order list with payment status (admins see all) |
| `/users` | ADMIN | Create / search / activate users |
| `/configuration` | ADMIN | Org settings: Meta, WhatsApp, address, OpenAI, Stripe, products |

State: `auth`, `users`, `config` slices ([UI/store/store.ts](UI/store/store.ts)). API base URL via `NEXT_PUBLIC_API_BASE_URL` (defaults to `/api`).

---

## Environment Variables

Copy [.env.example](.env.example) → `.env`. Key groups:

| Group | Vars |
|-------|------|
| **JWT / auth** | `JWT_SECRET`, `NETWORK_WEBHOOK_SECRET`, `JWT_ISSUER`, `JWT_AUDIENCE`, `JWT_ALGO`, `JWT_EXPIRES_IN`, `PASSWORD_ROUNDS` |
| **Core** | `PORT`, `NODE_ENV`, `MONGO_URI`, `ALLOWED_ORIGINS`, `WEBSITE_URL`, `SERVER_UI_URL` |
| **Redis / queue** | `USE_REDIS`, `USE_QUEUE`, `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `REDIS_DB` |
| **Stripe** | `STRIPE_SECRETS_KEY` — 32-byte base64 key that encrypts per-org Stripe secrets. Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` (per-org `pk`/`sk`/`whsec` are entered in the UI, not env) |
| **AWS** | `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_S3_PUBLIC_BUCKET_NAME`, `AWS_S3_PRIVATE_BUCKET_NAME`, `EMAIL_SENDER_ADMIN` |
| **Messaging** | `WHATSAPP_NUMBER`, `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `APP_SECRET`, `EXOTEL_*` |
| **AI** | `OPENAI_API_KEY`, `AGENTS_URL`, `WHATSAPP_AGENTS`, `BOT_TOKEN_NETWORK` |
| **Google** | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
| **Frontend** | `NEXT_PUBLIC_API_BASE_URL` (in `UI/.env`) |

> **Never** expose `STRIPE_SECRETS_KEY`, `sk_*` secret keys, or `JWT_SECRET` to the frontend. Per-org Stripe secrets live encrypted in MongoDB, decrypted only server-side at call time.
</content>
</invoke>
