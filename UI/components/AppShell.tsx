"use client";

/**
 * Shell for the signed-in app: a slim top bar carrying the profile menu on the
 * right, and the page below it. There is no navigation — the dashboard is the
 * only destination.
 */

import UserMenu from "./UserMenu";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-zinc-200 bg-white px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
            A
          </span>
          <span className="text-lg font-semibold tracking-tight text-zinc-900">
            Integration
          </span>
        </div>
        <UserMenu />
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
        {children}
      </main>
    </div>
  );
}
