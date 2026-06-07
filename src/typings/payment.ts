import mongoose, { Document } from 'mongoose'

/**
 * Stripe domain typings — payments, products, audit log and the per-org Stripe
 * configuration stored (encrypted) in the configuration DB. Order typings live
 * in `./order`.
 *
 * This is a multi-tenant setup: every org brings its own Stripe account. Secret
 * key and webhook secret are entered from the admin UI, encrypted at rest via
 * the SecretCrypto helper, and never returned to the client in plaintext.
 */

// ==================== Enums ====================

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  CANCELED = 'CANCELED',
}

/**
 * Mirrors Stripe's subscription statuses verbatim so the raw webhook value can
 * be stored without translation. See https://stripe.com/docs/api/subscriptions/object#subscription_object-status
 */
export enum SubscriptionStatus {
  ACTIVE = 'active',
  PAST_DUE = 'past_due',
  CANCELED = 'canceled',
  INCOMPLETE = 'incomplete',
  INCOMPLETE_EXPIRED = 'incomplete_expired',
  TRIALING = 'trialing',
  UNPAID = 'unpaid',
  PAUSED = 'paused',
}

/** Mirrors Stripe's invoice statuses. */
export enum InvoiceStatus {
  DRAFT = 'draft',
  OPEN = 'open',
  PAID = 'paid',
  UNCOLLECTIBLE = 'uncollectible',
  VOID = 'void',
}

/** Mirrors Stripe's payout statuses. */
export enum PayoutStatus {
  PENDING = 'pending',
  IN_TRANSIT = 'in_transit',
  PAID = 'paid',
  FAILED = 'failed',
  CANCELED = 'canceled',
}

export enum AuditAction {
  STRIPE_CONFIG_UPDATED = 'STRIPE_CONFIG_UPDATED',
  PRODUCT_CREATED = 'PRODUCT_CREATED',
  PRODUCT_UPDATED = 'PRODUCT_UPDATED',
  ORDER_CREATED = 'ORDER_CREATED',
  PAYMENT_INTENT_CREATED = 'PAYMENT_INTENT_CREATED',
  CHECKOUT_SESSION_CREATED = 'CHECKOUT_SESSION_CREATED',
  PAYMENT_SUCCEEDED = 'PAYMENT_SUCCEEDED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  REFUND_CREATED = 'REFUND_CREATED',
  REFUND_COMPLETED = 'REFUND_COMPLETED',
  // Subscriptions
  SUBSCRIPTION_CREATED = 'SUBSCRIPTION_CREATED',
  SUBSCRIPTION_UPDATED = 'SUBSCRIPTION_UPDATED',
  SUBSCRIPTION_DELETED = 'SUBSCRIPTION_DELETED',
  // Invoices (recurring billing)
  INVOICE_PAID = 'INVOICE_PAID',
  INVOICE_PAYMENT_FAILED = 'INVOICE_PAYMENT_FAILED',
  // Stripe Connect — connected accounts & payouts
  ACCOUNT_UPDATED = 'ACCOUNT_UPDATED',
  PAYOUT_PAID = 'PAYOUT_PAID',
  PAYOUT_FAILED = 'PAYOUT_FAILED',
  // Webhook lifecycle
  WEBHOOK_RECEIVED = 'WEBHOOK_RECEIVED',
  WEBHOOK_PROCESSED = 'WEBHOOK_PROCESSED',
  AUTH_FAILURE = 'AUTH_FAILURE',
}

// ==================== Per-org Stripe configuration ====================

/**
 * A subscription plan the org chooses to offer. Curated by the admin in the
 * Stripe configuration and rendered directly on the subscriber page — the
 * `priceId` must point at a recurring Stripe price in the org's account, which
 * is what `POST /subscriptions/checkout` charges against. The display fields
 * (name/amount/interval) are stored here so the page renders without a live
 * Stripe `prices.list` round-trip.
 */
export interface ISubscriptionProduct {
  priceId: string // Stripe recurring price id (price_…) — charged at checkout
  name: string
  description?: string
  amount?: number | null // smallest currency unit (e.g. cents); null for metered
  currency?: string // e.g. 'usd', 'inr'
  interval?: 'day' | 'week' | 'month' | 'year'
  intervalCount?: number
  featured?: boolean // highlight on the subscriber page
  isActive?: boolean // false hides the plan without deleting it; defaults to true
}

/**
 * Stored inside the organization configuration document. `secretKey` and
 * `webhookSecret` are persisted as `enc:v1:...` envelopes (see EncryptionService.encryptSecret).
 */
export interface IStripeConfiguration {
  isEnabled: boolean
  publishableKey?: string // pk_live_… — safe to expose to the frontend
  secretKey?: string // sk_live_… — ENCRYPTED at rest, never returned to client
  webhookSecret?: string // whsec_… — ENCRYPTED at rest, never returned to client
  defaultCurrency?: string // e.g. 'usd', 'inr'
  accountId?: string // Stripe account id (for future Stripe Connect support)
  livemode?: boolean
  subscriptionProducts?: ISubscriptionProduct[] // curated subscriber-page plans
  updatedAt?: Date
}

/** Shape returned to the admin UI — secrets masked, never the real values. */
export interface IStripeConfigurationView {
  isEnabled: boolean
  publishableKey?: string
  defaultCurrency?: string
  accountId?: string
  livemode?: boolean
  secretKeyMasked?: string
  webhookSecretConfigured: boolean
  secretKeyConfigured: boolean
  subscriptionProducts?: ISubscriptionProduct[]
  updatedAt?: Date
}

// ==================== Product ====================

/**
 * Minimal server-side price source so order amounts are computed on the server
 * and never trusted from the client (spec requirement).
 */
export interface IMongoProduct extends Document {
  _id: mongoose.Types.ObjectId
  orgId: mongoose.Types.ObjectId
  name: string
  description?: string
  amount: number // smallest currency unit (e.g. cents)
  currency: string
  isActive: boolean
  isDelete: boolean
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// ==================== Payment ====================

export interface IMongoPayment extends Document {
  _id: mongoose.Types.ObjectId
  orgId: mongoose.Types.ObjectId
  orderId: mongoose.Types.ObjectId
  paymentIntentId: string
  chargeId?: string
  amount: number
  amountRefunded?: number
  currency: string
  status: PaymentStatus
  stripeResponse?: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

// ==================== Subscription (recurring billing) ====================

/**
 * Local mirror of a Stripe Subscription, reconciled from
 * `customer.subscription.*` webhooks. `userId` is best-effort: it is only set
 * when the subscription carries an `orgId/userId` in its metadata.
 */
export interface IMongoSubscription extends Document {
  _id: mongoose.Types.ObjectId
  orgId: mongoose.Types.ObjectId
  userId?: mongoose.Types.ObjectId
  stripeSubscriptionId: string
  stripeCustomerId?: string
  priceId?: string
  status: SubscriptionStatus | string
  currentPeriodStart?: Date
  currentPeriodEnd?: Date
  cancelAtPeriodEnd?: boolean
  canceledAt?: Date
  stripeResponse?: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

// ==================== Invoice (recurring billing) ====================

/**
 * Local mirror of a Stripe Invoice, reconciled from `invoice.*` webhooks. Used
 * for subscription billing history. Amounts are in the smallest currency unit.
 */
export interface IMongoInvoice extends Document {
  _id: mongoose.Types.ObjectId
  orgId: mongoose.Types.ObjectId
  stripeInvoiceId: string
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  paymentIntentId?: string
  amountDue: number
  amountPaid: number
  currency: string
  status: InvoiceStatus | string
  hostedInvoiceUrl?: string
  stripeResponse?: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

// ==================== Payout (Stripe Connect) ====================

/**
 * Local mirror of a Stripe Payout to a connected account / bank, reconciled
 * from `payout.*` webhooks. Amounts are in the smallest currency unit.
 */
export interface IMongoPayout extends Document {
  _id: mongoose.Types.ObjectId
  orgId: mongoose.Types.ObjectId
  stripePayoutId: string
  stripeAccountId?: string
  amount: number
  currency: string
  status: PayoutStatus | string
  arrivalDate?: Date
  failureCode?: string
  failureMessage?: string
  stripeResponse?: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

// ==================== Audit Log ====================

export interface IMongoAuditLog extends Document {
  _id: mongoose.Types.ObjectId
  orgId?: mongoose.Types.ObjectId
  userId?: mongoose.Types.ObjectId
  action: AuditAction | string
  resourceType: string
  resourceId?: string
  ipAddress?: string
  userAgent?: string
  payload?: Record<string, unknown>
  createdAt: Date
}

// ==================== Connected Account (future Stripe Connect) ====================

export interface IMongoConnectedAccount extends Document {
  _id: mongoose.Types.ObjectId
  orgId: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  stripeAccountId: string
  onboardingStatus: string
  chargesEnabled?: boolean
  payoutsEnabled: boolean
  detailsSubmitted?: boolean
  stripeResponse?: Record<string, unknown>
  isDelete: boolean
  createdAt: Date
  updatedAt: Date
}
