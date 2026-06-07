"use client";

/**
 * Admin manager for the org's curated subscription plans (stored in the Stripe
 * config under `subscriptionProducts`). These drive the subscriber page
 * directly — each plan's `priceId` must be a recurring Stripe price (price_…)
 * in the org's Stripe account, which is what checkout charges against. The
 * other fields (name, amount, interval) are display metadata so the subscriber
 * page renders without a live Stripe round-trip.
 *
 * Amounts are entered in major units (e.g. 19.99) and stored in the smallest
 * unit (1999). The whole list is sent on every save (add/remove/reorder).
 */

import { useEffect, useState } from "react";
import { getErrorMessage } from "@/lib/api";
import { getStripeConfig, updateStripeConfig } from "@/features/payments/paymentsApi";
import type { SubscriptionProductConfig } from "@/features/payments/types";

const inputClass =
  "w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500";

const INTERVALS = ["day", "week", "month", "year"] as const;
type Interval = (typeof INTERVALS)[number];

interface FormFields {
  priceId: string;
  name: string;
  description: string;
  amountMajor: string;
  currency: string;
  interval: Interval;
  intervalCount: string;
  featured: boolean;
}

const EMPTY_FORM: FormFields = {
  priceId: "",
  name: "",
  description: "",
  amountMajor: "",
  currency: "usd",
  interval: "month",
  intervalCount: "1",
  featured: false,
};

function formatAmount(amount: number | null | undefined, currency: string): string {
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

/** "month" ×1 -> "/month"; ×3 -> "every 3 months". */
function intervalLabel(p: SubscriptionProductConfig): string {
  if (!p.interval) return "";
  const count = p.intervalCount ?? 1;
  return count === 1 ? `/${p.interval}` : `every ${count} ${p.interval}s`;
}

/** Convert a major-unit string (e.g. "19.99") to the smallest unit (1999). */
function toSmallestUnit(amountMajor: string): number {
  const amount = Math.round(parseFloat(amountMajor) * 100);
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error("Enter a valid amount.");
  }
  return amount;
}

function fromPlan(p: SubscriptionProductConfig): FormFields {
  return {
    priceId: p.priceId,
    name: p.name,
    description: p.description ?? "",
    amountMajor: p.amount != null ? (p.amount / 100).toString() : "",
    currency: p.currency ?? "usd",
    interval: (p.interval as Interval) ?? "month",
    intervalCount: (p.intervalCount ?? 1).toString(),
    featured: p.featured ?? false,
  };
}

export default function SubscriptionPlansManager() {
  const [plans, setPlans] = useState<SubscriptionProductConfig[]>([]);
  const [form, setForm] = useState<FormFields>(EMPTY_FORM);
  // null = adding a new plan; otherwise the index of the plan being edited.
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const cfg = await getStripeConfig();
        setPlans(cfg?.subscriptionProducts ?? []);
      } catch (e) {
        setError(getErrorMessage(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function set<K extends keyof FormFields>(key: K, value: FormFields[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingIndex(null);
    setError(null);
  }

  function startEdit(index: number) {
    setEditingIndex(index);
    setError(null);
    setForm(fromPlan(plans[index]));
  }

  /** Build the plan from the form, validating required fields. */
  function buildPlan(): SubscriptionProductConfig {
    const priceId = form.priceId.trim();
    if (!/^price_[A-Za-z0-9]+$/.test(priceId)) {
      throw new Error("Enter a valid Stripe recurring price id (price_…).");
    }
    if (!form.name.trim()) throw new Error("Enter a plan name.");
    const count = parseInt(form.intervalCount, 10);
    return {
      priceId,
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      amount: form.amountMajor.trim() ? toSmallestUnit(form.amountMajor) : null,
      currency: form.currency.toLowerCase(),
      interval: form.interval,
      intervalCount: Number.isFinite(count) && count > 0 ? count : 1,
      featured: form.featured,
      isActive: editingIndex != null ? plans[editingIndex].isActive ?? true : true,
    };
  }

  /** Persist the full list to the Stripe config. */
  async function persist(next: SubscriptionProductConfig[], message: string) {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const updated = await updateStripeConfig({ subscriptionProducts: next });
      setPlans(updated.subscriptionProducts ?? next);
      setSuccess(message);
      return true;
    } catch (e) {
      setError(getErrorMessage(e));
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    let plan: SubscriptionProductConfig;
    try {
      plan = buildPlan();
    } catch (err) {
      setError(getErrorMessage(err));
      return;
    }
    const next =
      editingIndex != null
        ? plans.map((p, i) => (i === editingIndex ? plan : p))
        : [...plans, plan];
    const ok = await persist(
      next,
      editingIndex != null ? "Plan updated." : "Plan added."
    );
    if (ok) resetForm();
  }

  async function toggleActive(index: number) {
    const next = plans.map((p, i) =>
      i === index ? { ...p, isActive: !(p.isActive ?? true) } : p
    );
    await persist(next, "Plan visibility updated.");
  }

  async function removePlan(index: number) {
    const next = plans.filter((_, i) => i !== index);
    const ok = await persist(next, "Plan removed.");
    if (ok && editingIndex === index) resetForm();
  }

  if (loading) {
    return <p className="text-sm text-zinc-500">Loading subscription plans…</p>;
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="grid max-w-xl grid-cols-2 gap-3">
        <input
          className={`${inputClass} col-span-2`}
          placeholder="Stripe price id (price_…)"
          value={form.priceId}
          onChange={(e) => set("priceId", e.target.value)}
          required
        />
        <input
          className={`${inputClass} col-span-2`}
          placeholder="Plan name (e.g. Pro)"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          required
        />
        <input
          className={`${inputClass} col-span-2`}
          placeholder="Description (optional)"
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
        />
        <input
          className={inputClass}
          placeholder="Amount (e.g. 19.99)"
          value={form.amountMajor}
          onChange={(e) => set("amountMajor", e.target.value)}
          inputMode="decimal"
        />
        <input
          className={`${inputClass} uppercase`}
          placeholder="Currency"
          value={form.currency}
          maxLength={3}
          onChange={(e) => set("currency", e.target.value.toLowerCase())}
        />
        <select
          className={inputClass}
          value={form.interval}
          onChange={(e) => set("interval", e.target.value as Interval)}
        >
          {INTERVALS.map((iv) => (
            <option key={iv} value={iv}>
              per {iv}
            </option>
          ))}
        </select>
        <input
          className={inputClass}
          placeholder="Interval count (e.g. 1)"
          value={form.intervalCount}
          onChange={(e) => set("intervalCount", e.target.value)}
          inputMode="numeric"
        />
        <label className="col-span-2 flex items-center gap-2 text-sm text-zinc-700">
          <input
            type="checkbox"
            checked={form.featured}
            onChange={(e) => set("featured", e.target.checked)}
            className="h-4 w-4 rounded border-zinc-300 text-indigo-600"
          />
          Featured (highlighted on the subscriber page)
        </label>

        {error && <p className="col-span-2 text-sm text-red-700">{error}</p>}
        {success && (
          <p className="col-span-2 text-sm text-emerald-700">{success}</p>
        )}

        <div className="col-span-2 flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
          >
            {saving
              ? "Saving…"
              : editingIndex != null
                ? "Save changes"
                : "Add plan"}
          </button>
          {editingIndex != null && (
            <button
              type="button"
              onClick={resetForm}
              disabled={saving}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <ul className="divide-y divide-zinc-100 rounded-lg border border-zinc-200 bg-white">
        {plans.length === 0 && (
          <li className="px-4 py-3 text-sm text-zinc-500">
            No subscription plans yet. Add one above — it appears on the subscriber
            page once saved.
          </li>
        )}
        {plans.map((p, i) => {
          const active = p.isActive ?? true;
          return (
            <li
              key={`${p.priceId}-${i}`}
              className={`flex items-center justify-between gap-3 px-4 py-3 ${
                editingIndex === i ? "bg-indigo-50/60" : ""
              }`}
            >
              <div className="min-w-0">
                <span className="flex items-center gap-2">
                  <span className="truncate text-sm text-zinc-800">{p.name}</span>
                  {p.featured && (
                    <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                      Featured
                    </span>
                  )}
                  {!active && (
                    <span className="text-xs font-medium text-amber-600">Hidden</span>
                  )}
                </span>
                <span className="block truncate text-xs text-zinc-500">
                  {p.priceId}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-zinc-900">
                  {formatAmount(p.amount, p.currency ?? "usd")}
                  <span className="ml-1 text-xs font-normal text-zinc-500">
                    {intervalLabel(p)}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => startEdit(i)}
                  className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => toggleActive(i)}
                  disabled={saving}
                  className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
                >
                  {active ? "Hide" : "Show"}
                </button>
                <button
                  type="button"
                  onClick={() => removePlan(i)}
                  disabled={saving}
                  className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
                >
                  Remove
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
