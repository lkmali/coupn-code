"use client";

/**
 * Protected layout — guards every page under (protected). Unauthenticated users
 * are redirected to /login. While the session is being restored we show a
 * spinner so the page never flashes its content.
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/store/hooks";
import AppShell from "@/components/AppShell";
import Spinner from "@/components/Spinner";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, initialized } = useAppSelector((s) => s.auth);

  useEffect(() => {
    if (initialized && !user) {
      router.replace("/login");
    }
  }, [initialized, user, router]);

  if (!initialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <Spinner label="Loading your workspace…" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <Spinner label="Redirecting to login…" />
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}
