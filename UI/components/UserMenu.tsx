"use client";

/**
 * Top-right profile menu: shows the details saved for this device and opens the
 * edit dialog.
 */

import { useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { updateUser } from "@/features/user/userSlice";
import { selectUser } from "@/features/user/userSelectors";
import EditDetailsModal from "./EditDetailsModal";
import Toast from "./Toast";
import type { UserDetails } from "@/lib/userDetails";

export default function UserMenu() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (!user) return null;

  const initials = user.userName
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  async function handleSave(values: UserDetails) {
    // unwrap() so a rejected save throws back into the form, which shows the
    // message and keeps the dialog open on the user's input.
    await dispatch(updateUser(values)).unwrap();
    setEditing(false);
    setToast("Details updated.");
  }

  return (
    <>
      <div className="relative" ref={ref}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={open}
          className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white py-1 pl-1 pr-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white">
            {initials || "U"}
          </span>
          <span className="hidden max-w-[10rem] truncate sm:inline">
            {user.userName}
          </span>
          <svg
            className={`h-4 w-4 text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`}
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        {open && (
          <div className="absolute right-0 z-20 mt-2 w-64 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg">
            <div className="border-b border-zinc-100 px-4 py-3">
              <p className="truncate text-sm font-semibold text-zinc-900">
                {user.userName}
              </p>
              <p className="truncate text-xs text-zinc-500">
                {user.mobileNumber}
              </p>
              <p className="truncate text-xs text-zinc-500">{user.upiId}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setEditing(true);
              }}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
            >
              Edit details
            </button>
          </div>
        )}
      </div>

      {editing && (
        <EditDetailsModal
          initialValues={{
            userName: user.userName,
            mobileNumber: user.mobileNumber,
            upiId: user.upiId,
          }}
          onSubmit={handleSave}
          onClose={() => setEditing(false)}
        />
      )}

      <Toast message={toast} onDone={() => setToast(null)} />
    </>
  );
}
