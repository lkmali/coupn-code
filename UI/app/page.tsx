"use client";

/**
 * Public landing page. On load it asks the backend whether this device already
 * has details on file; if not, it shows the popup.
 *
 * The device is identified by a localStorage machine id (with a fingerprint
 * fallback), never by IP — an IP changes on every network hop and would
 * re-prompt returning users.
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import UserDetailsModal from "@/components/UserDetailsModal";
import Spinner from "@/components/Spinner";
import {
  fetchUserForDevice,
  saveUserDetails,
  type SavedUser,
  type UserDetails,
} from "@/lib/userDetails";

type State =
  | { status: "loading" }
  | { status: "needsDetails" }
  | { status: "ready"; user: SavedUser }
  | { status: "error"; message: string };

export default function HomePage() {
  const [state, setState] = useState<State>({ status: "loading" });

  const load = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const user = await fetchUserForDevice();
      setState(user ? { status: "ready", user } : { status: "needsDetails" });
    } catch (error) {
      setState({
        status: "error",
        message:
          error instanceof Error ? error.message : "Unable to reach the server.",
      });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSubmit(values: UserDetails) {
    const user = await saveUserDetails(values);
    setState({ status: "ready", user });
  }

  if (state.status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <Spinner label="Loading your details…" />
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white px-6 py-8 text-center shadow-sm">
          <p className="text-sm text-zinc-600">{state.message}</p>
          <button
            type="button"
            onClick={() => void load()}
            className="mt-4 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-10">
      {state.status === "needsDetails" && <UserDetailsModal onSubmit={handleSubmit} />}

      {state.status === "ready" && (
        <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-100 px-6 py-5">
            <h1 className="text-lg font-semibold tracking-tight text-zinc-900">
              Welcome back, {state.user.userName.split(" ")[0]}
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Your details are saved on this device.
            </p>
          </div>

          <dl className="divide-y divide-zinc-100 px-6">
            <Row label="Full name" value={state.user.userName} />
            <Row label="Phone number" value={state.user.mobileNumber} />
            <Row label="UPI ID" value={state.user.upiId} />
          </dl>

          <div className="px-6 py-5">
            <Link
              href="/settings"
              className="inline-flex rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
            >
              Update details
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-3">
      <dt className="text-sm text-zinc-500">{label}</dt>
      <dd className="truncate text-sm font-medium text-zinc-900">{value}</dd>
    </div>
  );
}
