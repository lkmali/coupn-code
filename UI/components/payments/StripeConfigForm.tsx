"use client";

/**
 * Admin form to enter the org's Stripe keys. Secrets are stored encrypted in the
 * configuration DB and never returned — the form shows only whether they are
 * configured (plus a masked hint). Leaving a secret field blank keeps the stored
 * value unchanged.
 */

import { useEffect, useState } from "react";
import {
  getStripeConfig,
  updateStripeConfig,
} from "@/features/payments/paymentsApi";
import type { StripeConfigView } from "@/features/payments/types";
import { getErrorMessage } from "@/lib/api";

export default function StripeConfigForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState<StripeConfigView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [isEnabled, setIsEnabled] = useState(false);
  const [publishableKey, setPublishableKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [defaultCurrency, setDefaultCurrency] = useState("usd");

  useEffect(() => {
    (async () => {
      try {
        const cfg = await getStripeConfig();
        if (cfg) {
          setView(cfg);
          setIsEnabled(cfg.isEnabled);
          setPublishableKey(cfg.publishableKey ?? "");
          setDefaultCurrency(cfg.defaultCurrency ?? "usd");
        }
      } catch (e) {
        setError(getErrorMessage(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const updated = await updateStripeConfig({
        isEnabled,
        publishableKey: publishableKey || undefined,
        // Only send secrets when the admin typed a new value.
        secretKey: secretKey || undefined,
        webhookSecret: webhookSecret || undefined,
        defaultCurrency: defaultCurrency || undefined,
      });
      setView(updated);
      setSecretKey("");
      setWebhookSecret("");
      setSuccess("Stripe configuration saved.");
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-zinc-500">Loading Stripe configuration…</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-5">
      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={isEnabled}
          onChange={(e) => setIsEnabled(e.target.checked)}
          className="h-4 w-4 rounded border-zinc-300 text-indigo-600"
        />
        <span className="text-sm font-medium text-zinc-800">Enable Stripe payments</span>
      </label>

      <Field
        label="Publishable key"
        hint="pk_live_… or pk_test_… — safe to expose to the browser."
      >
        <input
          type="text"
          value={publishableKey}
          onChange={(e) => setPublishableKey(e.target.value)}
          placeholder="pk_live_…"
          className={inputClass}
          autoComplete="off"
        />
      </Field>

      <Field
        label="Secret key"
        hint={
          view?.secretKeyConfigured
            ? `Configured (${view.secretKeyMasked ?? "••••"}). Leave blank to keep unchanged.`
            : "sk_live_… or sk_test_… — stored encrypted, never shown again."
        }
      >
        <input
          type="password"
          value={secretKey}
          onChange={(e) => setSecretKey(e.target.value)}
          placeholder={view?.secretKeyConfigured ? "•••••••• (unchanged)" : "sk_live_…"}
          className={inputClass}
          autoComplete="new-password"
        />
      </Field>

      <Field
        label="Webhook signing secret"
        hint={
          view?.webhookSecretConfigured
            ? "Configured. Leave blank to keep unchanged."
            : "whsec_… from your Stripe webhook endpoint — stored encrypted."
        }
      >
        <input
          type="password"
          value={webhookSecret}
          onChange={(e) => setWebhookSecret(e.target.value)}
          placeholder={view?.webhookSecretConfigured ? "•••••••• (unchanged)" : "whsec_…"}
          className={inputClass}
          autoComplete="new-password"
        />
      </Field>

      <Field label="Default currency" hint="3-letter ISO code, e.g. usd, inr.">
        <input
          type="text"
          value={defaultCurrency}
          onChange={(e) => setDefaultCurrency(e.target.value.toLowerCase())}
          maxLength={3}
          className={`${inputClass} w-28 uppercase`}
        />
      </Field>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
      {success && (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save configuration"}
      </button>
    </form>
  );
}

const inputClass =
  "w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-zinc-800">{label}</label>
      {children}
      {hint && <p className="text-xs text-zinc-500">{hint}</p>}
    </div>
  );
}
