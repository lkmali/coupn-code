"use client";

/**
 * Forgot password page — collect the account email and ask the backend to
 * email a reset link. The link lands the user on /account/set-password.
 */

import { useState } from "react";
import Link from "next/link";
import { requestPasswordResetLink } from "@/features/auth/authApi";
import { getErrorMessage } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStatus("loading");
    try {
      await requestPasswordResetLink(email.trim());
      setStatus("sent");
    } catch (err) {
      setError(getErrorMessage(err));
      setStatus("idle");
    }
  }

  const submitting = status === "loading";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-50 to-indigo-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold text-white">
            A
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Forgot your password?
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Enter your email and we&apos;ll send you a reset link
          </p>
        </div>

        {status === "sent" ? (
          <div className="space-y-5 rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              If an account exists for <strong>{email.trim()}</strong>, a
              password reset link is on its way. Check your inbox.
            </div>
            <Link
              href="/login"
              className="inline-block text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              Back to sign in
            </Link>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="space-y-5 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm"
          >
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-zinc-700"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@clinic.com"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              )}
              {submitting ? "Sending…" : "Send reset link"}
            </button>

            <p className="text-center text-sm text-zinc-500">
              Remembered it?{" "}
              <Link
                href="/login"
                className="font-medium text-indigo-600 hover:text-indigo-700"
              >
                Back to sign in
              </Link>
            </p>
          </form>
        )}

        <p className="mt-6 text-center text-xs text-zinc-400">
          Authorized access only
        </p>
      </div>
    </div>
  );
}
