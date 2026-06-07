"use client";

/**
 * Stripe Payments page.
 *
 * Two flows are offered (selectable at the top):
 *
 *  1. "Payments Flow"  — Stripe Elements. The card is collected in-page; we
 *     create an order -> PaymentIntent -> confirm card -> poll order status.
 *  2. "Checkout Flow"  — Stripe-hosted Checkout. We create an order -> Checkout
 *     Session, then redirect the browser to Stripe's hosted page. On return,
 *     `?checkout=success&order_id=...` triggers status polling.
 *
 * In both flows the frontend NEVER marks the order paid — only the Stripe
 * webhook does. The UI just polls the order's status.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import CheckoutForm from "@/components/payments/CheckoutForm";
import SubscriptionsPanel from "@/components/payments/SubscriptionsPanel";
import {
  listProducts,
  createOrder,
  createPaymentIntent,
  createCheckoutSession,
  getOrderStatus,
  getPublishableKey,
} from "@/features/payments/paymentsApi";
import type { OrderStatus, Product } from "@/features/payments/types";
import { getErrorMessage } from "@/lib/api";

type Flow = "elements" | "checkout" | "subscription";
type Phase = "loading" | "not_configured" | "idle" | "paying" | "polling" | "done";

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

export default function PaymentsPage() {
  const [flow, setFlow] = useState<Flow>("elements");
  const [phase, setPhase] = useState<Phase>("loading");
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [subscriptionNotice, setSubscriptionNotice] = useState<string | null>(null);

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [amountLabel, setAmountLabel] = useState("");
  const [finalStatus, setFinalStatus] = useState<OrderStatus | null>(null);

  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  /** Poll the backend until the webhook updates the order's status. */
  const startPolling = useCallback((id: string) => {
    setOrderId(id);
    setPhase("polling");
    let attempts = 0;
    if (pollTimer.current) clearInterval(pollTimer.current);
    pollTimer.current = setInterval(async () => {
      attempts += 1;
      try {
        const status = await getOrderStatus(id);
        if (["PAID", "FAILED", "REFUNDED"].includes(status.status)) {
          if (pollTimer.current) clearInterval(pollTimer.current);
          setFinalStatus(status.status);
          setPhase("done");
        }
      } catch {
        /* keep polling */
      }
      if (attempts >= 15 && pollTimer.current) {
        clearInterval(pollTimer.current);
        setPhase("done");
        setFinalStatus(null); // still processing — webhook may be delayed
      }
    }, 2000);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { publishableKey, isEnabled } = await getPublishableKey();
        if (!isEnabled || !publishableKey) {
          setPhase("not_configured");
          return;
        }
        setStripePromise(loadStripe(publishableKey));
        setProducts(await listProducts());

        // Handle a return from a hosted Stripe page (checkout or subscription).
        const params = new URLSearchParams(window.location.search);
        const checkout = params.get("checkout");
        const subscription = params.get("subscription");
        const returnedOrderId = params.get("order_id");
        if ((checkout || subscription) && typeof window !== "undefined") {
          // Clean the query string so a refresh doesn't re-trigger this.
          window.history.replaceState({}, "", window.location.pathname);
        }
        // Returned from subscription Checkout — the webhook activates it, so we
        // just surface a notice and let the panel re-list the subscriptions.
        if (subscription === "success") {
          setFlow("subscription");
          setSubscriptionNotice(
            "Subscription started 🎉 It may take a moment to appear below while Stripe confirms it."
          );
          setPhase("idle");
          return;
        }
        if (subscription === "cancel") {
          setFlow("subscription");
          setSubscriptionNotice("Subscription checkout was canceled. You can try again.");
          setPhase("idle");
          return;
        }
        if (checkout === "success" && returnedOrderId) {
          setFlow("checkout");
          startPolling(returnedOrderId);
          return;
        }
        if (checkout === "cancel") {
          setFlow("checkout");
          setNotice("Checkout was canceled. You can try again.");
        }
        setPhase("idle");
      } catch (e) {
        setError(getErrorMessage(e));
        setPhase("idle");
      }
    })();
    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current);
    };
  }, [startPolling]);

  /** Elements flow: confirm the card in-page, then poll. */
  const handlePay = useCallback(async (product: Product) => {
    setError(null);
    setNotice(null);
    setFinalStatus(null);
    try {
      const order = await createOrder(product._id);
      const intent = await createPaymentIntent(order.orderId);
      setOrderId(order.orderId);
      setClientSecret(intent.clientSecret);
      setAmountLabel(formatAmount(order.amount, order.currency));
      setPhase("paying");
    } catch (e) {
      setError(getErrorMessage(e));
    }
  }, []);

  /** Checkout flow: create a hosted session and redirect to Stripe. */
  const handleCheckout = useCallback(async (product: Product) => {
    setError(null);
    setNotice(null);
    try {
      const order = await createOrder(product._id);
      const session = await createCheckoutSession(order.orderId);
      // Leave the SPA — Stripe takes over from here.
      window.location.href = session.url;
    } catch (e) {
      setError(getErrorMessage(e));
    }
  }, []);

  const handleConfirmed = useCallback(() => {
    if (orderId) startPolling(orderId);
  }, [orderId, startPolling]);

  function reset() {
    setClientSecret(null);
    setOrderId(null);
    setFinalStatus(null);
    setNotice(null);
    setPhase("idle");
  }

  function switchFlow(next: Flow) {
    if (next === flow) return;
    setFlow(next);
    reset();
  }

  const flowMeta: Record<Flow, { title: string; blurb: string }> = {
    elements: {
      title: "Payments Flow",
      blurb: "Enter card details on this page (Stripe Elements).",
    },
    checkout: {
      title: "Checkout Flow",
      blurb: "Redirect to Stripe's hosted checkout page.",
    },
    subscription: {
      title: "Subscriptions",
      blurb: "Recurring plans — monthly / yearly billing.",
    },
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Stripe Payments</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Choose how you want to collect payment. Order status is always confirmed by webhook.
      </p>

      {/* Flow selector */}
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {(Object.keys(flowMeta) as Flow[]).map((key) => {
          const active = flow === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => switchFlow(key)}
              disabled={phase === "paying" || phase === "polling"}
              className={[
                "rounded-xl border px-4 py-3 text-left transition",
                active
                  ? "border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600"
                  : "border-zinc-200 bg-white hover:border-zinc-300",
                phase === "paying" || phase === "polling" ? "opacity-50" : "",
              ].join(" ")}
            >
              <span className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
                <span
                  className={[
                    "inline-block h-2.5 w-2.5 rounded-full",
                    active ? "bg-indigo-600" : "bg-zinc-300",
                  ].join(" ")}
                />
                {flowMeta[key].title}
              </span>
              <span className="mt-1 block text-xs text-zinc-500">{flowMeta[key].blurb}</span>
            </button>
          );
        })}
      </div>

      {error && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
      {notice && (
        <p className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">{notice}</p>
      )}

      {phase === "loading" && <p className="mt-6 text-sm text-zinc-500">Loading…</p>}

      {phase === "not_configured" && (
        <p className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Stripe is not configured for this organization yet. An admin can set it up under
          Configuration → Payment Settings.
        </p>
      )}

      {/* Subscriptions flow — recurring plans, current subscriptions, billing */}
      {flow === "subscription" && phase !== "loading" && phase !== "not_configured" && (
        <SubscriptionsPanel initialNotice={subscriptionNotice} />
      )}

      {flow !== "subscription" && phase === "idle" && (
        <div className="mt-6 space-y-3">
          {products.length === 0 && (
            <p className="text-sm text-zinc-500">No products available yet.</p>
          )}
          {products.map((p) => (
            <div
              key={p._id}
              className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-zinc-900">{p.name}</p>
                {p.description && <p className="text-xs text-zinc-500">{p.description}</p>}
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold text-zinc-900">
                  {formatAmount(p.amount, p.currency)}
                </span>
                <button
                  onClick={() => (flow === "checkout" ? handleCheckout(p) : handlePay(p))}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                >
                  {flow === "checkout" ? "Checkout" : "Pay"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Elements (in-page) flow */}
      {(phase === "paying" || phase === "polling") &&
        flow === "elements" &&
        clientSecret &&
        stripePromise && (
          <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-5">
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CheckoutForm
                clientSecret={clientSecret}
                amountLabel={amountLabel}
                onConfirmed={handleConfirmed}
              />
            </Elements>
            {phase === "polling" && (
              <p className="mt-4 text-center text-sm text-zinc-500">
                Confirming your payment… waiting for Stripe to notify us.
              </p>
            )}
          </div>
        )}

      {/* Checkout (hosted) flow — polling after returning from Stripe */}
      {phase === "polling" && flow === "checkout" && (
        <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-6 text-center">
          <p className="text-sm text-zinc-500">
            Confirming your payment… waiting for Stripe to notify us.
          </p>
        </div>
      )}

      {flow !== "subscription" && phase === "done" && (
        <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-6 text-center">
          {finalStatus === "PAID" ? (
            <p className="text-base font-semibold text-emerald-700">Payment successful 🎉</p>
          ) : finalStatus === "FAILED" ? (
            <p className="text-base font-semibold text-red-700">Payment failed.</p>
          ) : finalStatus === "REFUNDED" ? (
            <p className="text-base font-semibold text-amber-700">Payment refunded.</p>
          ) : (
            <p className="text-base font-semibold text-zinc-700">
              Still processing — the confirmation webhook may be delayed.
            </p>
          )}
          <button
            onClick={reset}
            className="mt-4 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Back to products
          </button>
        </div>
      )}
    </div>
  );
}
