"use client";

/**
 * Public settings page — edit the details saved against this device. The record
 * is located by machine id, so a device can only edit the account it is already
 * linked to.
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import UserDetailsForm from "@/components/UserDetailsForm";
import Spinner from "@/components/Spinner";
import {
  fetchUserForDevice,
  updateUserDetails,
  type SavedUser,
  type UserDetails,
} from "@/lib/userDetails";

type State =
  | { status: "loading" }
  | { status: "ready"; user: SavedUser }
  | { status: "empty" }
  | { status: "error"; message: string };

export default function SettingsPage() {
  const [state, setState] = useState<State>({ status: "loading" });
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const user = await fetchUserForDevice();
      setState(user ? { status: "ready", user } : { status: "empty" });
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
    const user = await updateUserDetails(values);
    setState({ status: "ready", user });
    setSaved(true);
  }

  return (
    <div className="flex min-h-screen items-start justify-center bg-zinc-50 px-4 py-10">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-4 inline-block text-sm text-zinc-500 transition-colors hover:text-zinc-900"
        >
          ← Back to home
        </Link>

        <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-100 px-6 py-4">
            <h1 className="text-base font-semibold text-zinc-900">Your details</h1>
            <p className="mt-1 text-sm text-zinc-500">
              Update the information saved for this device.
            </p>
          </div>

          <div className="px-6 py-5">
            {state.status === "loading" && <Spinner label="Loading…" />}

            {state.status === "error" && (
              <div className="py-6 text-center">
                <p className="text-sm text-zinc-600">{state.message}</p>
                <button
                  type="button"
                  onClick={() => void load()}
                  className="mt-4 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
                >
                  Try again
                </button>
              </div>
            )}

            {state.status === "empty" && (
              <div className="py-6 text-center">
                <p className="text-sm text-zinc-600">
                  This device has no details saved yet. Add them from the home page
                  first.
                </p>
                <Link
                  href="/"
                  className="mt-4 inline-flex rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
                >
                  Go to home
                </Link>
              </div>
            )}

            {state.status === "ready" && (
              <>
                {saved && (
                  <div
                    role="status"
                    className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
                  >
                    Details updated successfully
                  </div>
                )}

                <UserDetailsForm
                  // Remount when the saved record changes so the inputs pick up
                  // the server-normalised values (e.g. "+91 98765 43210" -> "9876543210").
                  key={`${state.user.userId}-${state.user.mobileNumber}`}
                  initialValues={{
                    userName: state.user.userName,
                    mobileNumber: state.user.mobileNumber,
                    upiId: state.user.upiId,
                  }}
                  submitLabel="Save changes"
                  submittingLabel="Saving…"
                  onSubmit={handleSubmit}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
