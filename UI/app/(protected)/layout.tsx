"use client";

/**
 * Guards every page under (protected). A device with no details on file is sent
 * to the login form; while the lookup is in flight we hold a spinner so the
 * dashboard never flashes before we know who this is.
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { bootstrapUser } from "@/features/user/userSlice";
import {
  selectHasDetails,
  selectUserInitialized,
  selectUserLoadError,
} from "@/features/user/userSelectors";
import AppShell from "@/components/AppShell";
import Spinner from "@/components/Spinner";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const initialized = useAppSelector(selectUserInitialized);
  const hasDetails = useAppSelector(selectHasDetails);
  const loadError = useAppSelector(selectUserLoadError);

  // Only a *known-absent* record means "log in". An unreachable server also
  // leaves us without a user, and bouncing to the form there would ask for
  // details we may already have and couldn't save anyway.
  useEffect(() => {
    if (initialized && !hasDetails && !loadError) {
      router.replace("/login");
    }
  }, [initialized, hasDetails, loadError, router]);

  if (initialized && loadError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white px-6 py-8 text-center shadow-sm">
          <p className="text-sm text-zinc-600">{loadError}</p>
          <button
            type="button"
            onClick={() => void dispatch(bootstrapUser())}
            className="mt-4 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!initialized || !hasDetails) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <Spinner label={initialized ? "Redirecting…" : "Loading your details…"} />
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}
