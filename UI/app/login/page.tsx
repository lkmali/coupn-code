"use client";

/**
 * Login — collects the three details we need: name, phone number and UPI ID.
 *
 * This is the only gate in the app. It shows when the server doesn't recognise
 * this device; a device it does recognise skips straight to the dashboard.
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { registerUser } from "@/features/user/userSlice";
import {
  selectHasDetails,
  selectUserInitialized,
} from "@/features/user/userSelectors";
import UserDetailsForm from "@/components/UserDetailsForm";
import Spinner from "@/components/Spinner";
import type { UserDetails } from "@/lib/userDetails";

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const initialized = useAppSelector(selectUserInitialized);
  const hasDetails = useAppSelector(selectHasDetails);

  // Details already on file? Nothing to ask for.
  useEffect(() => {
    if (initialized && hasDetails) router.replace("/dashboard");
  }, [initialized, hasDetails, router]);

  async function handleSubmit(values: UserDetails) {
    // unwrap() so a failed save throws — the form catches it and shows the
    // server's message inline rather than navigating away from bad input.
    await dispatch(registerUser(values)).unwrap();
    router.replace("/dashboard");
  }

  if (!initialized || hasDetails) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <Spinner label="Loading…" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-50 to-indigo-50 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold text-white">
            A
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Welcome
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Add your details to get started. This is a one-time step for this
            device.
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
          <UserDetailsForm
            submitLabel="Continue"
            submittingLabel="Saving…"
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    </div>
  );
}
