"use client";

/**
 * The three fields collected on first visit, shared by the popup and the
 * settings page. Errors surface on blur (and after a submit attempt) so the
 * form doesn't scold you mid-keystroke.
 */

import { useMemo, useState } from "react";
import {
  validateUserDetails,
  type UserDetails,
  type UserDetailsErrors,
} from "@/lib/userDetails";

interface Props {
  initialValues?: Partial<UserDetails>;
  submitLabel: string;
  submittingLabel: string;
  onSubmit: (values: UserDetails) => Promise<void>;
  onCancel?: () => void;
}

const EMPTY: UserDetails = { userName: "", mobileNumber: "", upiId: "" };

export default function UserDetailsForm({
  initialValues,
  submitLabel,
  submittingLabel,
  onSubmit,
  onCancel,
}: Props) {
  const [values, setValues] = useState<UserDetails>({ ...EMPTY, ...initialValues });
  const [touched, setTouched] = useState<Partial<Record<keyof UserDetails, boolean>>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const errors: UserDetailsErrors = useMemo(() => validateUserDetails(values), [values]);
  const isValid = Object.keys(errors).length === 0;

  function set(field: keyof UserDetails, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  function errorFor(field: keyof UserDetails): string | undefined {
    return touched[field] || submitAttempted ? errors[field] : undefined;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitAttempted(true);
    setSubmitError(null);
    if (!isValid) return;

    setSubmitting(true);
    try {
      await onSubmit(values);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  const fields: Array<{
    name: keyof UserDetails;
    label: string;
    type: string;
    placeholder: string;
    autoComplete: string;
    hint?: string;
  }> = [
    {
      name: "userName",
      label: "Full name",
      type: "text",
      placeholder: "e.g. Anjali Mehta",
      autoComplete: "name",
    },
    {
      name: "mobileNumber",
      label: "Phone number",
      type: "tel",
      placeholder: "+91 98765 43210",
      autoComplete: "tel",
    },
    {
      name: "upiId",
      label: "UPI ID",
      type: "text",
      placeholder: "yourname@upi",
      autoComplete: "off",
      hint: "Used to send your payouts.",
    },
  ];

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {submitError && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {submitError}
        </div>
      )}

      {fields.map((field) => {
        const error = errorFor(field.name);
        return (
          <div key={field.name} className="space-y-1.5">
            <label
              htmlFor={field.name}
              className="block text-sm font-medium text-zinc-700"
            >
              {field.label}
            </label>
            <input
              id={field.name}
              name={field.name}
              type={field.type}
              value={values[field.name]}
              autoComplete={field.autoComplete}
              placeholder={field.placeholder}
              aria-invalid={Boolean(error)}
              aria-describedby={
                error ? `${field.name}-error` : field.hint ? `${field.name}-hint` : undefined
              }
              onChange={(e) => set(field.name, e.target.value)}
              onBlur={() => setTouched((prev) => ({ ...prev, [field.name]: true }))}
              className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-zinc-400 ${
                error
                  ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                  : "border-zinc-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              }`}
            />
            {error ? (
              <p id={`${field.name}-error`} role="alert" className="text-xs text-red-600">
                {error}
              </p>
            ) : field.hint ? (
              <p id={`${field.name}-hint`} className="text-xs text-zinc-500">
                {field.hint}
              </p>
            ) : null}
          </div>
        );
      })}

      <div className="flex items-center justify-end gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-4 py-2.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting && (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          )}
          {submitting ? submittingLabel : submitLabel}
        </button>
      </div>
    </form>
  );
}
