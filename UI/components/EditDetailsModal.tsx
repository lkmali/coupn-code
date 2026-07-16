"use client";

/**
 * Edit-details dialog opened from the profile menu.
 *
 * Unlike the login form these details already exist, so the dialog is
 * dismissible: Escape, the backdrop and Cancel all close it and leave the saved
 * record untouched.
 */

import { useEffect, useRef } from "react";
import UserDetailsForm from "./UserDetailsForm";
import type { UserDetails } from "@/lib/userDetails";

interface Props {
  initialValues: UserDetails;
  onSubmit: (values: UserDetails) => Promise<void>;
  onClose: () => void;
}

export default function EditDetailsModal({
  initialValues,
  onSubmit,
  onClose,
}: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Hold focus inside the dialog — tabbing out to the page behind it is a dead
  // end while the backdrop covers everything.
  useEffect(() => {
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    dialogRef.current?.querySelector<HTMLInputElement>("input")?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }
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
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-zinc-900/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-details-title"
        aria-describedby="edit-details-description"
        className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-zinc-200 bg-white shadow-xl"
      >
        <div className="border-b border-zinc-100 px-6 py-4">
          <h2
            id="edit-details-title"
            className="text-base font-semibold text-zinc-900"
          >
            Edit your details
          </h2>
          <p
            id="edit-details-description"
            className="mt-1 text-sm text-zinc-500"
          >
            Update the name, phone number or UPI ID saved for this device.
          </p>
        </div>

        <div className="px-6 py-5">
          <UserDetailsForm
            initialValues={initialValues}
            submitLabel="Save changes"
            submittingLabel="Saving…"
            onSubmit={onSubmit}
            onCancel={onClose}
          />
        </div>
      </div>
    </div>
  );
}
