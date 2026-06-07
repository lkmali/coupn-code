/**
 * Payment & Stripe-config API calls.
 *
 * The backend wraps successful responses as `{ success: true, data: ... }`, so
 * each helper unwraps `.data.data`.
 */

import { api } from "@/lib/api";
import type {
  Product,
  CreateProductPayload,
  UpdateProductPayload,
  CreatedOrder,
  OrderStatus,
  OrderStatusResponse,
  OrderListResult,
  CreatePaymentIntentResponse,
  CreateCheckoutSessionResponse,
  StripeConfigView,
  UpdateStripeConfigPayload,
  SubscriptionPlan,
  Subscription,
  CreateSubscriptionCheckoutResponse,
} from "./types";

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

/** GET /products — org product catalog. */
export async function listProducts(): Promise<Product[]> {
  const { data } = await api.get<ApiEnvelope<Product[]>>("/products");
  return data.data;
}

/** POST /products — create a product (admin). Names must be unique within the org. */
export async function createProduct(payload: CreateProductPayload): Promise<Product> {
  const { data } = await api.post<ApiEnvelope<Product>>("/products", payload);
  return data.data;
}

/** PUT /products/:id — edit an existing product (admin). Only supplied fields change. */
export async function updateProduct(
  id: string,
  payload: UpdateProductPayload
): Promise<Product> {
  const { data } = await api.put<ApiEnvelope<Product>>(`/products/${id}`, payload);
  return data.data;
}

/** POST /orders — create a PENDING order (amount computed server-side). */
export async function createOrder(
  productId: string,
  metadata?: Record<string, unknown>
): Promise<CreatedOrder> {
  const { data } = await api.post<ApiEnvelope<CreatedOrder>>("/orders", {
    productId,
    metadata,
  });
  return data.data;
}

/**
 * GET /orders — paginated orders joined with payment info. Admins get every
 * order in the org; regular users get only their own (enforced server-side).
 */
export async function listOrders(params: {
  pageNumber?: number;
  limit?: number;
  status?: OrderStatus;
} = {}): Promise<OrderListResult> {
  const { data } = await api.get<ApiEnvelope<OrderListResult>>("/orders", {
    params: {
      pageNumber: params.pageNumber,
      limit: params.limit,
      status: params.status,
    },
  });
  return data.data;
}

/** GET /orders/:id — order status (only webhooks can mark it PAID). */
export async function getOrderStatus(orderId: string): Promise<OrderStatusResponse> {
  const { data } = await api.get<ApiEnvelope<OrderStatusResponse>>(`/orders/${orderId}`);
  return data.data;
}

/** POST /payments/create-intent — create a PaymentIntent, returns clientSecret. */
export async function createPaymentIntent(
  orderId: string
): Promise<CreatePaymentIntentResponse> {
  const { data } = await api.post<ApiEnvelope<CreatePaymentIntentResponse>>(
    "/payments/create-intent",
    { orderId }
  );
  return data.data;
}

/**
 * POST /payments/create-checkout-session — create a hosted Checkout Session.
 * Returns the Stripe-hosted URL to redirect the browser to.
 */
export async function createCheckoutSession(
  orderId: string
): Promise<CreateCheckoutSessionResponse> {
  const { data } = await api.post<ApiEnvelope<CreateCheckoutSessionResponse>>(
    "/payments/create-checkout-session",
    { orderId }
  );
  return data.data;
}

/** POST /payments/refund — refund a paid order (admin only). */
export async function refundOrder(orderId: string): Promise<{ status: string; refundId: string }> {
  const { data } = await api.post<ApiEnvelope<{ status: string; refundId: string }>>(
    "/payments/refund",
    { orderId }
  );
  return data.data;
}

/* ------------------------------ Subscriptions ------------------------------ */

/** GET /subscriptions/plans — the org's active recurring prices (plans). */
export async function listPlans(): Promise<SubscriptionPlan[]> {
  const { data } = await api.get<ApiEnvelope<SubscriptionPlan[]>>("/subscriptions/plans");
  return data.data;
}

/**
 * POST /subscriptions/checkout — create a hosted Checkout Session in
 * `subscription` mode for a recurring price. Returns the Stripe URL to redirect to.
 */
export async function createSubscriptionCheckout(
  priceId: string,
  trialPeriodDays?: number
): Promise<CreateSubscriptionCheckoutResponse> {
  const { data } = await api.post<ApiEnvelope<CreateSubscriptionCheckoutResponse>>(
    "/subscriptions/checkout",
    { priceId, trialPeriodDays }
  );
  return data.data;
}

/** GET /subscriptions — the current user's subscriptions (newest first). */
export async function listSubscriptions(): Promise<Subscription[]> {
  const { data } = await api.get<ApiEnvelope<Subscription[]>>("/subscriptions");
  return data.data;
}

/**
 * POST /subscriptions/:id/cancel — cancel a subscription. Defaults to
 * cancel-at-period-end; pass `immediately` to cancel right away.
 */
export async function cancelSubscription(
  stripeSubscriptionId: string,
  immediately = false
): Promise<{ stripeSubscriptionId: string; status: string; cancelAtPeriodEnd: boolean }> {
  const { data } = await api.post<
    ApiEnvelope<{ stripeSubscriptionId: string; status: string; cancelAtPeriodEnd: boolean }>
  >(`/subscriptions/${stripeSubscriptionId}/cancel`, { immediately });
  return data.data;
}

/** POST /subscriptions/billing-portal — Stripe Customer Portal URL to manage billing. */
export async function createBillingPortalSession(): Promise<{ url: string }> {
  const { data } = await api.post<ApiEnvelope<{ url: string }>>(
    "/subscriptions/billing-portal",
    {}
  );
  return data.data;
}

/* ------------------------------ Stripe config ------------------------------ */

/** GET /stripe/config — masked Stripe configuration (admin). */
export async function getStripeConfig(): Promise<StripeConfigView | null> {
  const { data } = await api.get<ApiEnvelope<StripeConfigView | null>>("/stripe/config");
  return data.data;
}

/** POST /stripe/config — create/update Stripe configuration (admin). */
export async function updateStripeConfig(
  payload: UpdateStripeConfigPayload
): Promise<StripeConfigView> {
  const { data } = await api.post<ApiEnvelope<StripeConfigView>>("/stripe/config", payload);
  return data.data;
}

/** GET /stripe/publishable-key — publishable key for Stripe.js init. */
export async function getPublishableKey(): Promise<{ publishableKey?: string; isEnabled: boolean }> {
  const { data } = await api.get<ApiEnvelope<{ publishableKey?: string; isEnabled: boolean }>>(
    "/stripe/publishable-key"
  );
  return data.data;
}
