/** Stripe payment domain types (frontend mirror of the backend contracts). */

export type OrderStatus = "PENDING" | "PROCESSING" | "PAID" | "FAILED" | "REFUNDED";

export interface Product {
  _id: string;
  name: string;
  description?: string;
  amount: number; // smallest currency unit (e.g. cents)
  currency: string;
  isActive: boolean;
}

export interface CreateProductPayload {
  name: string;
  description?: string;
  amount: number; // smallest currency unit (e.g. cents)
  currency?: string;
}

export interface UpdateProductPayload {
  name?: string;
  description?: string;
  amount?: number; // smallest currency unit (e.g. cents)
  currency?: string;
  isActive?: boolean;
}

export interface CreatedOrder {
  orderId: string;
  amount: number;
  currency: string;
  status: OrderStatus;
}

export interface OrderStatusResponse {
  id: string;
  status: OrderStatus;
  amount: number;
  currency: string;
}

export type PaymentStatus =
  | "PENDING"
  | "PROCESSING"
  | "SUCCEEDED"
  | "FAILED"
  | "REFUNDED"
  | "CANCELED";

export interface OrderPaymentInfo {
  status: PaymentStatus;
  amount: number;
  amountRefunded: number;
  currency: string;
  chargeId?: string;
  paymentIntentId: string;
}

export interface OrderListItem {
  orderId: string;
  amount: number;
  currency: string;
  status: OrderStatus;
  productName?: string;
  paymentIntentId?: string;
  createdAt: string;
  payment: OrderPaymentInfo | null;
}

export interface OrderListResult {
  items: OrderListItem[];
  total: number;
  pageNumber: number;
  limit: number;
}

export interface CreatePaymentIntentResponse {
  clientSecret: string;
  publishableKey?: string;
  paymentIntentId: string;
}

export interface CreateCheckoutSessionResponse {
  url: string;
  sessionId: string;
}

/* -------------------------------- Subscriptions ------------------------------- */

/** An available recurring plan (a Stripe recurring price + its product). */
export interface SubscriptionPlan {
  priceId: string;
  productName: string;
  description?: string;
  amount: number | null; // smallest currency unit (e.g. cents); null for metered
  currency: string;
  interval?: "day" | "week" | "month" | "year";
  intervalCount?: number;
  featured?: boolean;
}

/**
 * Admin-curated subscription plan stored in the Stripe config. Drives the
 * subscriber page directly. `priceId` must be a recurring Stripe price.
 */
export interface SubscriptionProductConfig {
  priceId: string;
  name: string;
  description?: string;
  amount?: number | null; // smallest currency unit (e.g. cents)
  currency?: string;
  interval?: "day" | "week" | "month" | "year";
  intervalCount?: number;
  featured?: boolean;
  isActive?: boolean;
}

export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "incomplete"
  | "incomplete_expired"
  | "paused";

/** A user's subscription, mirrored locally from customer.subscription.* webhooks. */
export interface Subscription {
  stripeSubscriptionId: string;
  stripeCustomerId?: string;
  status: SubscriptionStatus;
  priceId?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
  canceledAt?: string;
  createdAt: string;
}

export interface CreateSubscriptionCheckoutResponse {
  url: string;
  sessionId: string;
}

export interface StripeConfigView {
  isEnabled: boolean;
  publishableKey?: string;
  defaultCurrency?: string;
  accountId?: string;
  livemode?: boolean;
  secretKeyConfigured: boolean;
  secretKeyMasked?: string;
  webhookSecretConfigured: boolean;
  subscriptionProducts?: SubscriptionProductConfig[];
  updatedAt?: string;
}

export interface UpdateStripeConfigPayload {
  isEnabled?: boolean;
  publishableKey?: string;
  secretKey?: string;
  webhookSecret?: string;
  defaultCurrency?: string;
  accountId?: string;
  subscriptionProducts?: SubscriptionProductConfig[];
}
