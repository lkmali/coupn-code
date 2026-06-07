"use client";

/**
 * Admin Configuration — set the organization data that the backend uses in its
 * outbound API requests (Meta/WhatsApp credentials, phone numbers, address,
 * API keys). Loaded from and saved to /organization-configuration.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { loadConfig, saveConfig } from "@/features/config/configSlice";
import {
  selectConfig,
  selectConfigError,
  selectConfigSaving,
  selectConfigStatus,
} from "@/features/config/configSelectors";
import { selectIsAdmin } from "@/features/auth/authSelectors";
import Spinner from "@/components/Spinner";
import Toast from "@/components/Toast";
import StripeConfigForm from "@/components/payments/StripeConfigForm";
import ProductsManager from "@/components/payments/ProductsManager";
import SubscriptionPlansManager from "@/components/payments/SubscriptionPlansManager";
import type {
  OrganizationConfiguration,
  PhoneNumberInfo,
} from "@/lib/types";

interface FormState {
  baseUrl: string;
  version: string;
  whatsappAgentsUrl: string;
  appSecret: string;
  userAccessToken: string;
  whatsappToken: string;
  whatsappPhoneNumberId: string;
  address: string;
  mapLink: string;
  openaiApiKey: string;
  phones: PhoneNumberInfo[];
}

const EMPTY: FormState = {
  baseUrl: "",
  version: "",
  whatsappAgentsUrl: "",
  appSecret: "",
  userAccessToken: "",
  whatsappToken: "",
  whatsappPhoneNumberId: "",
  address: "",
  mapLink: "",
  openaiApiKey: "",
  phones: [],
};

function fromConfig(c: OrganizationConfiguration | null): FormState {
  if (!c) return { ...EMPTY };
  return {
    baseUrl: c.metaAttributes?.baseUrl ?? "",
    version: c.metaAttributes?.version ?? "",
    whatsappAgentsUrl: c.metaAttributes?.whatsappAgentsUrl ?? "",
    appSecret: c.metaAttributes?.appSecret ?? "",
    userAccessToken: c.metaAttributes?.userAccessToken ?? "",
    whatsappToken: c.metaAttributes?.whatsapp?.token ?? "",
    whatsappPhoneNumberId: c.metaAttributes?.whatsapp?.phoneNumberId ?? "",
    address: c.organizationAddress?.address ?? "",
    mapLink: c.organizationAddress?.mapLink ?? "",
    openaiApiKey: c.openaiApiKey ?? "",
    phones: c.phoneNumberInformation ?? [],
  };
}

/** Reusable labelled text input (class-only styling). */
function TextInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-zinc-700">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
      />
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-zinc-900">{title}</h2>
        {description && (
          <p className="mt-0.5 text-sm text-zinc-500">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}

export default function ConfigurationPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const isAdmin = useAppSelector(selectIsAdmin);
  const config = useAppSelector(selectConfig);
  const status = useAppSelector(selectConfigStatus);
  const saving = useAppSelector(selectConfigSaving);
  const error = useAppSelector(selectConfigError);

  const [form, setForm] = useState<FormState>(EMPTY);
  const [toast, setToast] = useState<string | null>(null);
  const [toastVariant, setToastVariant] = useState<"success" | "error">(
    "success"
  );

  useEffect(() => {
    if (isAdmin === false) router.replace("/");
  }, [isAdmin, router]);

  useEffect(() => {
    if (isAdmin) dispatch(loadConfig());
  }, [dispatch, isAdmin]);

  // Re-seed the form whenever fresh config arrives.
  useEffect(() => {
    setForm(fromConfig(config));
  }, [config]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function updatePhone(index: number, patch: Partial<PhoneNumberInfo>) {
    setForm((f) => ({
      ...f,
      phones: f.phones.map((p, i) => (i === index ? { ...p, ...patch } : p)),
    }));
  }

  function addPhone() {
    setForm((f) => ({
      ...f,
      phones: [...f.phones, { phoneNumber: "", location: "", isEnabled: true }],
    }));
  }

  function removePhone(index: number) {
    setForm((f) => ({
      ...f,
      phones: f.phones.filter((_, i) => i !== index),
    }));
  }

  function buildPayload(): OrganizationConfiguration {
    const payload: OrganizationConfiguration = {};

    const meta: NonNullable<OrganizationConfiguration["metaAttributes"]> = {};
    if (form.baseUrl) meta.baseUrl = form.baseUrl;
    if (form.version) meta.version = form.version;
    if (form.whatsappAgentsUrl) meta.whatsappAgentsUrl = form.whatsappAgentsUrl;
    if (form.appSecret) meta.appSecret = form.appSecret;
    if (form.userAccessToken) meta.userAccessToken = form.userAccessToken;
    if (form.whatsappToken || form.whatsappPhoneNumberId) {
      meta.whatsapp = {};
      if (form.whatsappToken) meta.whatsapp.token = form.whatsappToken;
      if (form.whatsappPhoneNumberId)
        meta.whatsapp.phoneNumberId = form.whatsappPhoneNumberId;
    }
    if (Object.keys(meta).length) payload.metaAttributes = meta;

    const phones = form.phones.filter((p) => p.phoneNumber.trim());
    if (phones.length) payload.phoneNumberInformation = phones;

    // Backend requires both address + a valid mapLink URL when present.
    if (form.address.trim() && form.mapLink.trim()) {
      payload.organizationAddress = {
        address: form.address.trim(),
        mapLink: form.mapLink.trim(),
      };
    }

    if (form.openaiApiKey) payload.openaiApiKey = form.openaiApiKey;

    return payload;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = await dispatch(saveConfig(buildPayload()));
    if (saveConfig.fulfilled.match(result)) {
      setToastVariant("success");
      setToast("Configuration saved successfully.");
    } else {
      setToastVariant("error");
      setToast((result.payload as string) || "Failed to save configuration.");
    }
  }

  if (!isAdmin) return null;

  if (status === "loading" && !config) {
    return <Spinner label="Loading configuration…" />;
  }

  return (
    <div className="space-y-6">
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Configuration
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Organization data used in outbound API requests.
          </p>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving && (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          )}
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Section
        title="Meta / Graph API"
        description="Base settings used when calling the Meta Graph API."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextInput
            label="Base URL"
            value={form.baseUrl}
            onChange={(v) => set("baseUrl", v)}
            placeholder="https://graph.facebook.com"
          />
          <TextInput
            label="API Version"
            value={form.version}
            onChange={(v) => set("version", v)}
            placeholder="v18.0"
          />
          <TextInput
            label="WhatsApp Agents URL"
            value={form.whatsappAgentsUrl}
            onChange={(v) => set("whatsappAgentsUrl", v)}
            placeholder="https://agents.example.com"
          />
          <TextInput
            label="App Secret"
            type="password"
            value={form.appSecret}
            onChange={(v) => set("appSecret", v)}
            placeholder="••••••••"
          />
          <TextInput
            label="User Access Token"
            type="password"
            value={form.userAccessToken}
            onChange={(v) => set("userAccessToken", v)}
            placeholder="••••••••"
          />
        </div>
      </Section>

      <Section
        title="WhatsApp"
        description="Credentials for sending WhatsApp messages via the Cloud API."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextInput
            label="Phone Number ID"
            value={form.whatsappPhoneNumberId}
            onChange={(v) => set("whatsappPhoneNumberId", v)}
            placeholder="123456789012345"
          />
          <TextInput
            label="Access Token"
            type="password"
            value={form.whatsappToken}
            onChange={(v) => set("whatsappToken", v)}
            placeholder="••••••••"
          />
        </div>
      </Section>

      <Section
        title="Phone Numbers"
        description="Contact numbers shown and used by the organization."
      >
        <div className="space-y-3">
          {form.phones.length === 0 && (
            <p className="text-sm text-zinc-500">No phone numbers added yet.</p>
          )}
          {form.phones.map((phone, i) => (
            <div
              key={i}
              className="flex flex-col gap-3 rounded-lg border border-zinc-100 bg-zinc-50/60 p-3 sm:flex-row sm:items-center"
            >
              <input
                type="tel"
                value={phone.phoneNumber}
                onChange={(e) =>
                  updatePhone(i, { phoneNumber: e.target.value })
                }
                placeholder="919876543210"
                className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
              <input
                type="text"
                value={phone.location ?? ""}
                onChange={(e) => updatePhone(i, { location: e.target.value })}
                placeholder="Location (e.g. Reception)"
                className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
              <label className="flex items-center gap-2 text-sm text-zinc-600">
                <input
                  type="checkbox"
                  checked={phone.isEnabled ?? true}
                  onChange={(e) =>
                    updatePhone(i, { isEnabled: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                />
                Enabled
              </label>
              <button
                type="button"
                onClick={() => removePhone(i)}
                className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addPhone}
            className="inline-flex items-center gap-1 rounded-lg border border-dashed border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:border-indigo-300 hover:text-indigo-600"
          >
            + Add phone number
          </button>
        </div>
      </Section>

      <Section
        title="Organization Address"
        description="Both fields are required together; the map link must be a valid URL."
      >
        <div className="grid grid-cols-1 gap-4">
          <TextInput
            label="Address"
            value={form.address}
            onChange={(v) => set("address", v)}
            placeholder="123 Healthcare Avenue, Mumbai"
          />
          <TextInput
            label="Map Link"
            value={form.mapLink}
            onChange={(v) => set("mapLink", v)}
            placeholder="https://maps.google.com/?q=19.07,72.87"
          />
        </div>
      </Section>

      <Section
        title="AI Keys"
        description="API key used for AI-powered features."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextInput
            label="OpenAI API Key"
            type="password"
            value={form.openaiApiKey}
            onChange={(v) => set("openaiApiKey", v)}
            placeholder="sk-••••••••"
          />
        </div>
      </Section>
    </form>

      <Section
        title="Payment Settings"
        description="Stripe keys used to accept payments for this organization. Secrets are stored encrypted and never shown again."
      >
        <StripeConfigForm />
      </Section>

      <Section
        title="Products"
        description="Catalog of products customers can pay for. Amounts back server-side pricing."
      >
        <ProductsManager />
      </Section>

      <Section
        title="Subscription Plans"
        description="Recurring plans shown on the subscriber page. Each plan maps to a recurring Stripe price (price_…); the name, amount and interval are display details."
      >
        <SubscriptionPlansManager />
      </Section>

      <Toast
        message={toast}
        variant={toastVariant}
        onDone={() => setToast(null)}
      />
    </div>
  );
}
