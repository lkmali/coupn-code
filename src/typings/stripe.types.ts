import Stripe = require('stripe')

/**
 * The stripe package's CommonJS type entry exposes the constructor as
 * `StripeConstructor` and does NOT re-export the resource namespace under
 * `Stripe.*` when `moduleResolution` is "node". To stay robust against that, we
 * derive the resource types we need from the client instance itself.
 */
export type StripeClient = ReturnType<typeof Stripe>
export type StripeEvent = ReturnType<StripeClient['webhooks']['constructEvent']>
export type StripePaymentIntent = Awaited<ReturnType<StripeClient['paymentIntents']['retrieve']>>
export type StripeCharge = Awaited<ReturnType<StripeClient['charges']['retrieve']>>
export type StripeCheckoutSession = Awaited<ReturnType<StripeClient['checkout']['sessions']['retrieve']>>
export type StripeSubscription = Awaited<ReturnType<StripeClient['subscriptions']['retrieve']>>
export type StripeInvoice = Awaited<ReturnType<StripeClient['invoices']['retrieve']>>
export type StripePayout = Awaited<ReturnType<StripeClient['payouts']['retrieve']>>
export type StripeAccount = Awaited<ReturnType<StripeClient['accounts']['retrieve']>>
