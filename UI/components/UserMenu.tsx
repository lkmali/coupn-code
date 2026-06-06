"use client";

/**
 * Top-right user dropdown: shows the logged-in user's name and exposes
 * "My Profile" and "Logout".
 */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logout } from "@/features/auth/authSlice";

export default function UserMenu() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const user = useAppSelector((s) => s.auth.user);
  console.log("LAXMAN CONSOLE",user)
  const roles = useAppSelector((s) => s.auth.roles);


  console.log("LAXMAN roles",roles)
  const [open, setOpen] = useState(false);
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

  const isAdmin = roles.includes("ADMIN");
  const initials = user.userName
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  function handleLogout() {
    dispatch(logout());
    router.replace("/login");
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
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
        <div className="absolute right-0 z-20 mt-2 w-60 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg">
          <div className="border-b border-zinc-100 px-4 py-3">
            <p className="truncate text-sm font-semibold text-zinc-900">
              {user.userName}
            </p>
            <p className="truncate text-xs text-zinc-500">{user.email}</p>
            <span className="mt-2 inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700">
              {isAdmin ? "ADMIN" : "USER"}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              router.push("/profile");
            }}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-zinc-700 transition-colors hover:bg-zinc-50"
          >
            My Profile
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 border-t border-zinc-100 px-4 py-2.5 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
