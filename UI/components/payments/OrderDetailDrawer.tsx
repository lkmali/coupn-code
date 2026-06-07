"use client";

/**
 * Slide-in drawer showing the full detail of a single order: the order summary,
 * the reconciled Stripe payment (intent / charge / refunded amount) and, for
 * admins, a refund action on paid orders. Rendered on top of the orders table
 * when a row is clicked.
 */

import { useEffect, useState } from "react";
import { refundOrder } from "@/features/payments/paymentsApi";
import type {
  OrderListItem,
  OrderStatus,
  PaymentStatus,
} from "@/features/payments/types";
import { getErrorMessage } from "@/lib/api";

function formatAmount(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  } catch {
    return `${(amount / 100).toFixed(2)} ${currency.toUpperCase()}`;
  }
}

function formatDate(value: string): string {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

const ORDER_BADGE: Record<OrderStatus, string> = {
  PENDING: "bg-zinc-100 text-zinc-600",
  PROCESSING: "bg-amber-50 text-amber-700",
  PAID: "bg-emerald-50 text-emerald-700",
  FAILED: "bg-red-50 text-red-700",
  REFUNDED: "bg-indigo-50 text-indigo-700",
};

const PAYMENT_BADGE: Record<PaymentStatus, string> = {
  PENDING: "bg-zinc-100 text-zinc-600",
  PROCESSING: "bg-amber-50 text-amber-700",
  SUCCEEDED: "bg-emerald-50 text-emerald-700",
  FAILED: "bg-red-50 text-red-700",
  REFUNDED: "bg-indigo-50 text-indigo-700",
  CANCELED: "bg-zinc-100 text-zinc-500",
};

function StatusBadge({ label, className }: { label: string; className: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}
    >
      {label}
    </span>
  );
}

/** A copyable identifier with monospace styling and a one-shot "copied" hint. */
function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable — ignore */
    }
  }

  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
        {label}
      </p>
      <button
        type="button"
        onClick={copy}
        title="Click to copy"
        className="group flex w-full items-center justify-between gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-left transition-colors hover:border-indigo-200 hover:bg-indigo-50/40"
      >
        <span className="truncate font-mono text-xs text-zinc-700">{value}</span>
        <span className="shrink-0 text-xs font-medium text-indigo-600 opacity-0 transition-opacity group-hover:opacity-100">
          {copied ? "Copied" : "Copy"}
        </span>
      </button>
    </div>
  );
}

interface Props {
  order: OrderListItem | null;
  isAdmin: boolean;
  onClose: () => void;
  /** Called after a successful refund so the table can reload. */
  onRefunded: (message: string) => void;
}

export default function OrderDetailDrawer({
  order,
  isAdmin,
  onClose,
  onRefunded,
}: Props) {
  const [refunding, setRefunding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Close on Escape for quick keyboard dismissal.
  useEffect(() => {
    if (!order) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [order, onClose]);

  useEffect(() => {
    setError(null);
  }, [order]);

  if (!order) return null;

  const payment = order.payment;
  const canRefund =
    isAdmin &&
    order.status === "PAID" &&
    payment != null &&
    payment.status === "SUCCEEDED" &&
    payment.amountRefunded < payment.amount;

  async function handleRefund() {
    if (!order) return;
    setRefunding(true);
    setError(null);
    try {
      await refundOrder(order.orderId);
      onRefunded("Refund issued successfully");
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setRefunding(false);
    }
  }

  return (
    <div className="fixed inset-0 z-30 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-zinc-900/40"
        onClick={onClose}
        aria-hidden
      />

      {/* Panel */}
      <div className="relative flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-zinc-200 bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-zinc-100 px-6 py-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
              Order detail
            </p>
            <h2 className="mt-0.5 font-mono text-sm text-zinc-900">
              {order.orderId}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600"
            aria-label="Close"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        <div className="space-y-6 px-6 py-5">
          {/* Headline amount */}
          <div className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-zinc-50 to-white p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
              Amount
            </p>
            <p className="mt-1 text-3xl font-semibold tracking-tight text-zinc-900">
              {formatAmount(order.amount, order.currency)}
            </p>
            <div className="mt-3 flex items-center gap-2">
              <StatusBadge
                label={order.status}
                className={ORDER_BADGE[order.status]}
              />
              {payment && (
                <StatusBadge
                  label={`Payment: ${payment.status}`}
                  className={PAYMENT_BADGE[payment.status]}
                />
              )}
            </div>
          </div>

          {/* Order facts */}
          <dl className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                Product
              </dt>
              <dd className="mt-1 text-sm text-zinc-800">
                {order.productName ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                Currency
              </dt>
              <dd className="mt-1 text-sm uppercase text-zinc-800">
                {order.currency}
              </dd>
            </div>
            <div className="col-span-2">
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                Created
              </dt>
              <dd className="mt-1 text-sm text-zinc-800">
                {formatDate(order.createdAt)}
              </dd>
            </div>
          </dl>

          {/* Payment block */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-zinc-900">Payment</h3>
            {payment ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                      Charged
                    </p>
                    <p className="mt-1 text-sm font-medium text-zinc-900">
                      {formatAmount(payment.amount, payment.currency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                      Refunded
                    </p>
                    <p className="mt-1 text-sm font-medium text-zinc-900">
                      {payment.amountRefunded > 0
                        ? formatAmount(payment.amountRefunded, payment.currency)
                        : "—"}
                    </p>
                  </div>
                </div>
                <CopyField
                  label="Payment intent"
                  value={payment.paymentIntentId}
                />
                {payment.chargeId && (
                  <CopyField label="Charge" value={payment.chargeId} />
                )}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-zinc-200 px-4 py-6 text-center text-sm text-zinc-500">
                No payment has been recorded for this order yet.
              </div>
            )}
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        {/* Refund action (admins, paid orders) */}
        {canRefund && (
          <div className="mt-auto border-t border-zinc-100 px-6 py-4">
            <button
              type="button"
              onClick={handleRefund}
              disabled={refunding}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {refunding && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-red-300 border-t-red-600" />
              )}
              {refunding ? "Refunding…" : "Refund this order"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
