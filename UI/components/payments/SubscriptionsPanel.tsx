"use client";

/**
 * Subscriptions panel (Stripe Billing, `mode: 'subscription'`).
 *
 * Unlike the one-time payment flows, a plan here is a *recurring* Stripe price.
 * The user picks a plan -> we create a hosted Checkout Session in subscription
 * mode -> redirect to Stripe. The subscription only becomes active via the
 * customer.subscription.* webhook, never the success redirect — so on return we
 * just re-list the user's subscriptions.
 *
 * Plans are grouped by billing interval (Monthly / Yearly / …) with a selector,
 * so the same product priced both monthly and yearly shows under each tab.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  listPlans,
  listSubscriptions,
  createSubscriptionCheckout,
  cancelSubscription,
  createBillingPortalSession,
} from "@/features/payments/paymentsApi";
import type {
  SubscriptionPlan,
  Subscription,
  SubscriptionStatus,
} from "@/features/payments/types";
import { getErrorMessage } from "@/lib/api";

function formatAmount(amount: number | null, currency: string): string {
  if (amount == null) return "—";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  } catch {
    return `${(amount / 100).toFixed(2)} ${currency.toUpperCase()}`;
  }
}

/** "month" -> "/month", "3 month" -> "every 3 months". */
function intervalLabel(plan: SubscriptionPlan): string {
  if (!plan.interval) return "";
  const count = plan.intervalCount ?? 1;
  if (count === 1) return `/${plan.interval}`;
  return `every ${count} ${plan.interval}s`;
}

/** Human label for the interval selector tabs. */
const INTERVAL_TITLES: Record<string, string> = {
  day: "Daily",
  week: "Weekly",
  month: "Monthly",
  year: "Yearly",
};

function formatDate(iso?: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700",
  trialing: "bg-indigo-50 text-indigo-700",
  past_due: "bg-amber-50 text-amber-800",
  unpaid: "bg-amber-50 text-amber-800",
  canceled: "bg-zinc-100 text-zinc-600",
  incomplete: "bg-zinc-100 text-zinc-600",
  incomplete_expired: "bg-zinc-100 text-zinc-600",
  paused: "bg-zinc-100 text-zinc-600",
};

function StatusBadge({ status }: { status: SubscriptionStatus }) {
  return (
    <span
      className={[
        "inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize",
        STATUS_STYLES[status] ?? "bg-zinc-100 text-zinc-600",
      ].join(" ")}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

/** Subscriptions that no longer grant access — hidden from "active" treatment. */
const INACTIVE_STATUSES = new Set<SubscriptionStatus>([
  "canceled",
  "incomplete_expired",
]);

export default function SubscriptionsPanel({
  initialNotice,
}: {
  initialNotice?: string | null;
}) {
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(initialNotice ?? null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [selectedInterval, setSelectedInterval] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const [planList, subs] = await Promise.all([listPlans(), listSubscriptions()]);
    setPlans(planList);
    setSubscriptions(subs);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await refresh();
      } catch (e) {
        setError(getErrorMessage(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [refresh]);

  // Distinct billing intervals present, ordered shortest -> longest.
  const intervalOrder = ["day", "week", "month", "year"];
  const intervals = useMemo(() => {
    const present = new Set(plans.map((p) => p.interval).filter(Boolean) as string[]);
    return intervalOrder.filter((i) => present.has(i));
  }, [plans]);

  // Default the interval tab to "month" when available, else the first present.
  useEffect(() => {
    if (selectedInterval || intervals.length === 0) return;
    setSelectedInterval(intervals.includes("month") ? "month" : intervals[0]);
  }, [intervals, selectedInterval]);

  const visiblePlans = useMemo(() => {
    const list =
      intervals.length <= 1
        ? plans
        : plans.filter((p) => p.interval === selectedInterval);
    // Featured plans first; otherwise keep the configured order.
    return [...list].sort(
      (a, b) => Number(b.featured ?? false) - Number(a.featured ?? false)
    );
  }, [plans, intervals, selectedInterval]);

  // priceIds the user is currently subscribed to (active/trialing/past_due).
  const subscribedPriceIds = useMemo(
    () =>
      new Set(
        subscriptions
          .filter((s) => !INACTIVE_STATUSES.has(s.status) && s.priceId)
          .map((s) => s.priceId as string)
      ),
    [subscriptions]
  );

  const activeSubscriptions = subscriptions.filter(
    (s) => !INACTIVE_STATUSES.has(s.status)
  );

  const handleSubscribe = useCallback(async (plan: SubscriptionPlan) => {
    setError(null);
    setNotice(null);
    setBusyId(plan.priceId);
    try {
      const session = await createSubscriptionCheckout(plan.priceId);
      window.location.href = session.url; // Stripe takes over.
    } catch (e) {
      setError(getErrorMessage(e));
      setBusyId(null);
    }
  }, []);

  const handleCancel = useCallback(
    async (sub: Subscription) => {
      setError(null);
      setNotice(null);
      setBusyId(sub.stripeSubscriptionId);
      try {
        await cancelSubscription(sub.stripeSubscriptionId, false);
        setNotice(
          "Your subscription will end at the close of the current billing period."
        );
        await refresh();
      } catch (e) {
        setError(getErrorMessage(e));
      } finally {
        setBusyId(null);
      }
    },
    [refresh]
  );

  const handleManageBilling = useCallback(async () => {
    setError(null);
    setBusyId("__portal__");
    try {
      const { url } = await createBillingPortalSession();
      window.location.href = url;
    } catch (e) {
      setError(getErrorMessage(e));
      setBusyId(null);
    }
  }, []);

  if (loading) {
    return <p className="mt-6 text-sm text-zinc-500">Loading plans…</p>;
  }

  return (
    <div className="mt-6 space-y-8">
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
      {notice && (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">{notice}</p>
      )}

      {/* Current subscriptions */}
      {activeSubscriptions.length > 0 && (
        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-900">Your subscriptions</h2>
            <button
              onClick={handleManageBilling}
              disabled={busyId === "__portal__"}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
            >
              {busyId === "__portal__" ? "Opening…" : "Manage billing"}
            </button>
          </div>
          <div className="mt-3 space-y-3">
            {activeSubscriptions.map((sub) => {
              const plan = plans.find((p) => p.priceId === sub.priceId);
              return (
                <div
                  key={sub.stripeSubscriptionId}
                  className="rounded-lg border border-zinc-200 bg-white px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-zinc-900">
                        {plan?.productName ?? "Subscription"}
                      </p>
                      <p className="mt-0.5 text-xs text-zinc-500">
                        {sub.cancelAtPeriodEnd
                          ? `Ends ${formatDate(sub.currentPeriodEnd)}`
                          : `Renews ${formatDate(sub.currentPeriodEnd)}`}
                      </p>
                    </div>
                    <StatusBadge status={sub.status} />
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    {sub.cancelAtPeriodEnd ? (
                      <span className="text-xs font-medium text-amber-700">
                        Cancellation scheduled
                      </span>
                    ) : (
                      <button
                        onClick={() => handleCancel(sub)}
                        disabled={busyId === sub.stripeSubscriptionId}
                        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                      >
                        {busyId === sub.stripeSubscriptionId
                          ? "Canceling…"
                          : "Cancel plan"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Available plans */}
      <section>
        <h2 className="text-sm font-semibold text-zinc-900">
          {activeSubscriptions.length > 0 ? "Change plan" : "Choose a plan"}
        </h2>

        {plans.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">
            No subscription plans available yet. An admin can create recurring prices in
            the Stripe dashboard.
          </p>
        ) : (
          <>
            {/* Interval selector — only when more than one interval exists */}
            {intervals.length > 1 && (
              <div className="mt-3 inline-flex rounded-lg border border-zinc-200 bg-zinc-50 p-1">
                {intervals.map((iv) => {
                  const active = selectedInterval === iv;
                  return (
                    <button
                      key={iv}
                      onClick={() => setSelectedInterval(iv)}
                      className={[
                        "rounded-md px-3 py-1.5 text-xs font-medium transition",
                        active
                          ? "bg-white text-zinc-900 shadow-sm"
                          : "text-zinc-500 hover:text-zinc-700",
                      ].join(" ")}
                    >
                      {INTERVAL_TITLES[iv] ?? iv}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {visiblePlans.map((plan) => {
                const subscribed = subscribedPriceIds.has(plan.priceId);
                return (
                  <div
                    key={plan.priceId}
                    className={[
                      "flex flex-col rounded-xl border bg-white p-5",
                      plan.featured
                        ? "border-indigo-300 ring-1 ring-indigo-200"
                        : "border-zinc-200",
                    ].join(" ")}
                  >
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-zinc-900">
                          {plan.productName}
                        </p>
                        {plan.featured && (
                          <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                            Popular
                          </span>
                        )}
                      </div>
                      {plan.description && (
                        <p className="mt-1 text-xs text-zinc-500">{plan.description}</p>
                      )}
                      <p className="mt-3">
                        <span className="text-2xl font-semibold text-zinc-900">
                          {formatAmount(plan.amount, plan.currency)}
                        </span>
                        <span className="ml-1 text-sm text-zinc-500">
                          {intervalLabel(plan)}
                        </span>
                      </p>
                    </div>
                    <button
                      onClick={() => handleSubscribe(plan)}
                      disabled={subscribed || busyId === plan.priceId}
                      className={[
                        "mt-4 rounded-lg px-4 py-2 text-sm font-semibold transition",
                        subscribed
                          ? "cursor-default bg-zinc-100 text-zinc-500"
                          : "bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50",
                      ].join(" ")}
                    >
                      {subscribed
                        ? "Current plan"
                        : busyId === plan.priceId
                        ? "Redirecting…"
                        : "Subscribe"}
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
