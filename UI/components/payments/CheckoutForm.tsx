"use client";

/**
 * Stripe Elements card form. Collects card data via Stripe's CardElement (raw
 * card details never touch our servers) and confirms the PaymentIntent.
 *
 * IMPORTANT: a successful confirmCardPayment does NOT mean the order is paid.
 * The parent polls the order status, which only flips to PAID when the Stripe
 * webhook says so. The frontend never decides payment success.
 */

import { useState } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

const CARD_OPTIONS = {
  style: {
    base: {
      fontSize: "16px",
      color: "#18181b",
      "::placeholder": { color: "#a1a1aa" },
    },
    invalid: { color: "#dc2626" },
  },
};

export default function CheckoutForm({
  clientSecret,
  amountLabel,
  onConfirmed,
}: {
  clientSecret: string;
  amountLabel: string;
  /** Called after Stripe confirms; the parent then polls the order status. */
  onConfirmed: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    setError(null);

    const card = elements.getElement(CardElement);
    if (!card) {
      setError("Card field is not ready. Please retry.");
      setSubmitting(false);
      return;
    }

    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card },
    });

    if (result.error) {
      setError(result.error.message ?? "Payment could not be completed.");
      setSubmitting(false);
      return;
    }

    // Stripe accepted the payment. Hand off to the parent to confirm the order
    // status via webhook-driven backend state.
    setSubmitting(false);
    onConfirmed();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-lg border border-zinc-300 bg-white px-3 py-3">
        <CardElement options={CARD_OPTIONS} />
      </div>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!stripe || submitting}
        className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Processing…" : `Pay ${amountLabel}`}
      </button>

      <p className="text-center text-xs text-zinc-400">
        Payments are processed securely by Stripe. We never store your card details.
      </p>
    </form>
  );
}
