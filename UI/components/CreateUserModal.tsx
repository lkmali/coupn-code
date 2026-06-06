"use client";

/**
 * Modal form for creating a new user. Role is fixed to USER because the backend
 * does not allow creating ADMIN accounts through this endpoint.
 */

import { useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { createUser } from "@/features/users/usersSlice";
import { selectUsersMutating } from "@/features/users/usersSelectors";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (message: string) => void;
}

export default function CreateUserModal({ open, onClose, onCreated }: Props) {
  const dispatch = useAppDispatch();
  const mutating = useAppSelector(selectUsersMutating);

  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  function reset() {
    setUserName("");
    setEmail("");
    setMobileNumber("");
    setPassword("");
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }
    const result = await dispatch(
      createUser({
        userName: userName.trim(),
        email: email.trim(),
        mobileNumber: mobileNumber.trim(),
        password,
        roles: ["USER"],
      })
    );
    if (createUser.fulfilled.match(result)) {
      onCreated(result.payload || "User created successfully");
      reset();
      onClose();
    } else {
      setError((result.payload as string) || "Failed to create user");
    }
  }

  function handleClose() {
    reset();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-zinc-900/40 px-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
          <h2 className="text-base font-semibold text-zinc-900">
            Create new user
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600"
            aria-label="Close"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-zinc-700">
              Full name
            </label>
            <input
              type="text"
              required
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="e.g. Anjali Mehta"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-zinc-700">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@clinic.com"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-zinc-700">
              Mobile number
            </label>
            <input
              type="tel"
              required
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
              placeholder="+919876543210"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-zinc-700">
              Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              autoComplete="new-password"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-zinc-700">
              Role
            </label>
            <input
              type="text"
              value="USER"
              disabled
              className="w-full cursor-not-allowed rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg px-4 py-2.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutating}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {mutating && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              )}
              {mutating ? "Creating…" : "Create user"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
