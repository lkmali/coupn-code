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

export interface StripeConfigView {
  isEnabled: boolean;
  publishableKey?: string;
  defaultCurrency?: string;
  accountId?: string;
  livemode?: boolean;
  secretKeyConfigured: boolean;
  secretKeyMasked?: string;
  webhookSecretConfigured: boolean;
  updatedAt?: string;
}

export interface UpdateStripeConfigPayload {
  isEnabled?: boolean;
  publishableKey?: string;
  secretKey?: string;
  webhookSecret?: string;
  defaultCurrency?: string;
  accountId?: string;
}
