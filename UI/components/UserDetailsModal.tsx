"use client";

/**
 * First-visit popup. Deliberately not dismissible — no close button, no Escape
 * handler, no backdrop click — because the details are required before the app
 * is usable. Shown only when the server doesn't recognise this device.
 */

import { useEffect, useRef } from "react";
import UserDetailsForm from "./UserDetailsForm";
import type { UserDetails } from "@/lib/userDetails";

interface Props {
  onSubmit: (values: UserDetails) => Promise<void>;
}

export default function UserDetailsModal({ onSubmit }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Hold focus inside the dialog: it's the only thing on screen that matters,
  // and tabbing to the page behind it would be a dead end.
  useEffect(() => {
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    dialogRef.current?.querySelector<HTMLInputElement>("input")?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Tab") return;

      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'input, button, [href], select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable?.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-zinc-900/40 px-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-details-title"
        aria-describedby="user-details-description"
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-zinc-200 bg-white shadow-xl"
      >
        <div className="border-b border-zinc-100 px-6 py-4">
          <h2 id="user-details-title" className="text-base font-semibold text-zinc-900">
            Complete your details
          </h2>
          <p id="user-details-description" className="mt-1 text-sm text-zinc-500">
            We need a few details before you get started. This is a one-time step
            for this device.
          </p>
        </div>

        <div className="px-6 py-5">
          <UserDetailsForm
            submitLabel="Save details"
            submittingLabel="Saving…"
            onSubmit={onSubmit}
          />
        </div>
      </div>
    </div>
  );
}
