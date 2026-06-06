"use client";

/**
 * Admin product catalog manager: list existing products, create new ones, and
 * edit existing ones in place. Amounts are entered in major units (e.g. 19.99)
 * and sent in the smallest unit (1999). Used inside the Configuration page's
 * Payment Settings section. Product names must be unique within the org — the
 * backend rejects duplicates and the error is surfaced here.
 */

import { useEffect, useState } from "react";
import { getErrorMessage } from "@/lib/api";
import {
  listProducts,
  createProduct,
  updateProduct,
} from "@/features/payments/paymentsApi";
import type { Product } from "@/features/payments/types";

const inputClass =
  "w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500";

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

interface FormFields {
  name: string;
  description: string;
  amountMajor: string;
  currency: string;
}

const EMPTY_FORM: FormFields = {
  name: "",
  description: "",
  amountMajor: "",
  currency: "usd",
};

/** Convert a major-unit string (e.g. "19.99") to the smallest unit (1999). */
function toSmallestUnit(amountMajor: string): number {
  const amount = Math.round(parseFloat(amountMajor) * 100);
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error("Enter a valid amount.");
  }
  return amount;
}

export default function ProductsManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<FormFields>(EMPTY_FORM);
  // null = creating a new product; otherwise the id of the product being edited.
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function refresh() {
    try {
      setProducts(await listProducts());
    } catch (e) {
      setError(getErrorMessage(e));
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  function set<K extends keyof FormFields>(key: K, value: FormFields[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setError(null);
  }

  function startEdit(p: Product) {
    setEditingId(p._id);
    setError(null);
    setForm({
      name: p.name,
      description: p.description ?? "",
      amountMajor: (p.amount / 100).toString(),
      currency: p.currency,
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const amount = toSmallestUnit(form.amountMajor);
      const payload = {
        name: form.name.trim(),
        description: form.description || undefined,
        amount,
        currency: form.currency,
      };
      if (editingId) {
        await updateProduct(editingId, payload);
      } else {
        await createProduct(payload);
      }
      resetForm();
      await refresh();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="grid max-w-xl grid-cols-2 gap-3">
        <input
          className={`${inputClass} col-span-2`}
          placeholder="Product name"
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
          required
        />
        <input
          className={`${inputClass} uppercase`}
          placeholder="Currency"
          value={form.currency}
          maxLength={3}
          onChange={(e) => set("currency", e.target.value.toLowerCase())}
          required
        />
        {error && <p className="col-span-2 text-sm text-red-700">{error}</p>}
        <div className="col-span-2 flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
          >
            {saving
              ? editingId
                ? "Saving…"
                : "Adding…"
              : editingId
                ? "Save changes"
                : "Add product"}
          </button>
          {editingId && (
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
        {products.length === 0 && (
          <li className="px-4 py-3 text-sm text-zinc-500">No products yet.</li>
        )}
        {products.map((p) => (
          <li
            key={p._id}
            className={`flex items-center justify-between gap-3 px-4 py-3 ${
              editingId === p._id ? "bg-indigo-50/60" : ""
            }`}
          >
            <div className="min-w-0">
              <span className="block truncate text-sm text-zinc-800">{p.name}</span>
              {!p.isActive && (
                <span className="text-xs font-medium text-amber-600">Inactive</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-zinc-900">
                {formatAmount(p.amount, p.currency)}
              </span>
              <button
                type="button"
                onClick={() => startEdit(p)}
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Edit
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
