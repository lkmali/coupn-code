"use client";

/**
 * Entry point. There is nothing to show at the root — the dashboard's layout
 * already decides between the login form and the app, so hand straight over.
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Spinner from "@/components/Spinner";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50">
      <Spinner label="Loading…" />
    </div>
  );
}
