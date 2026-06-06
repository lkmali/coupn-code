/**
 * Stripe service module.
 *
 * Everything Stripe-specific lives here. The implementation is multi-tenant:
 * each organization brings its own Stripe account, and credentials are read
 * (decrypted) per `orgId` from the organization configuration. New Stripe
 * capabilities (Checkout Sessions, Subscriptions, Invoices, Connect, …) should
 * be added as additional files in this folder and re-exported below, so the
 * rest of the app keeps importing them from `../service`.
 *
 *   StripeConfigService  – per-org config (encrypted secret/webhook keys)
 *   StripeClientService  – per-org cached Stripe SDK client
 *   PaymentService       – payment intents, refunds, webhook dispatch
 *   CheckoutService      – hosted Checkout Sessions (redirect flow)
 *   SubscriptionService  – recurring subscriptions (customer.subscription.*)
 *   InvoiceService       – subscription billing history (invoice.*)
 *   ConnectService       – Stripe Connect accounts & payouts (account/payout.*)
 */
export * from './stripeConfig.service'
export * from './stripeClient.service'
export * from './payment.service'
export * from './checkout.service'
export * from './subscription.service'
export * from './invoice.service'
export * from './connect.service'
