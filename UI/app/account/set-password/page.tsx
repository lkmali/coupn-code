"use client";

/**
 * Set password page — reached from the reset link emailed to the user:
 *   /account/set-password?token={encryptedOtp}&email={email}
 * The token is the encrypted OTP; we pass it straight back to the backend,
 * which decrypts and verifies it before updating the password.
 */

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { setPasswordWithOtp } from "@/features/auth/authApi";
import { getErrorMessage } from "@/lib/api";

function SetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const email = params.get("email") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  const linkValid = Boolean(token && email);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setStatus("loading");
    try {
      await setPasswordWithOtp(email, password, token);
      setStatus("done");
    } catch (err) {
      setError(getErrorMessage(err));
      setStatus("idle");
    }
  }

  const submitting = status === "loading";

  if (!linkValid) {
    return (
      <div className="space-y-5 rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          This reset link is invalid or incomplete. Please request a new one.
        </div>
        <Link
          href="/forgot-password"
          className="inline-block text-sm font-medium text-indigo-600 hover:text-indigo-700"
        >
          Request a new link
        </Link>
      </div>
    );
  }

  if (status === "done") {
    return (
      <div className="space-y-5 rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Your password has been updated. You can now sign in with your new
          password.
        </div>
        <button
          type="button"
          onClick={() => router.replace("/login")}
          className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
        >
          Go to sign in
        </button>
      </div>
    );
  }

  return (
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
        <label className="block text-sm font-medium text-zinc-700">Email</label>
        <input
          type="email"
          value={email}
          readOnly
          className="w-full cursor-not-allowed rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-500"
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="password"
          className="block text-sm font-medium text-zinc-700"
        >
          New password
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 pr-16 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute inset-y-0 right-0 px-3 text-xs font-medium text-zinc-500 hover:text-zinc-700"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="confirm"
          className="block text-sm font-medium text-zinc-700"
        >
          Confirm password
        </label>
        <input
          id="confirm"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Re-enter your new password"
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
        {submitting ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}

export default function SetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-50 to-indigo-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold text-white">
            A
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Set a new password
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Choose a strong password for your account
          </p>
        </div>

        <Suspense
          fallback={
            <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500 shadow-sm">
              Loading…
            </div>
          }
        >
          <SetPasswordForm />
        </Suspense>

        <p className="mt-6 text-center text-xs text-zinc-400">
          Authorized access only
        </p>
      </div>
    </div>
  );
}
