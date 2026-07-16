"use client";

/**
 * Left navigation sidebar. Lists the primary destinations (admin-only links
 * included) as a vertical menu. Clicking an item navigates to that page and
 * highlights the active route. Used inside AppShell, which also renders it as a
 * slide-in drawer on small screens.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppSelector } from "@/store/hooks";

interface NavItem {
  href: string;
  label: string;
  adminOnly?: boolean;
  icon: React.ReactNode;
}

const NAV: NavItem[] = [
  {
    href: "/dashboard",
    label: "Home",
    icon: (
      <path d="M10 2.5 2.5 8.5v8a1 1 0 0 0 1 1H8v-4.5a2 2 0 1 1 4 0V17.5h4.5a1 1 0 0 0 1-1v-8L10 2.5Z" />
    ),
  },
  {
    href: "/users",
    label: "User Management",
    adminOnly: true,
    icon: (
      <path d="M7 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7 1a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM1.5 16a5.5 5.5 0 0 1 11 0 .5.5 0 0 1-.5.5H2a.5.5 0 0 1-.5-.5Zm12.06.5c.13-.32.2-.66.2-1a6.48 6.48 0 0 0-1.3-3.9 4 4 0 0 1 6.04 3.4.5.5 0 0 1-.5.5h-4.44Z" />
    ),
  },
  {
    href: "/payments",
    label: "Payments",
    icon: (
      <path
        fillRule="evenodd"
        d="M2.5 5A1.5 1.5 0 0 1 4 3.5h12A1.5 1.5 0 0 1 17.5 5v10a1.5 1.5 0 0 1-1.5 1.5H4A1.5 1.5 0 0 1 2.5 15V5Zm1.5 0v2h12V5H4Zm12 4H4v6h12V9Zm-9 3.5h3a.75.75 0 0 1 0 1.5h-3a.75.75 0 0 1 0-1.5Z"
        clipRule="evenodd"
      />
    ),
  },
  {
    href: "/orders",
    label: "Orders",
    icon: (
      <path
        fillRule="evenodd"
        d="M4 2.5a1.5 1.5 0 0 0-1.5 1.5v12A1.5 1.5 0 0 0 4 17.5h12a1.5 1.5 0 0 0 1.5-1.5V4A1.5 1.5 0 0 0 16 2.5H4ZM6.25 6a.75.75 0 0 0 0 1.5h7.5a.75.75 0 0 0 0-1.5h-7.5Zm0 3.25a.75.75 0 0 0 0 1.5h7.5a.75.75 0 0 0 0-1.5h-7.5ZM6.25 12.5a.75.75 0 0 0 0 1.5h4a.75.75 0 0 0 0-1.5h-4Z"
        clipRule="evenodd"
      />
    ),
  },
  {
    href: "/copilot",
    label: "Copilot",
    icon: (
      <path
        fillRule="evenodd"
        d="M10 1.5a1 1 0 0 1 1 1V3h2.5A2.5 2.5 0 0 1 16 5.5v6A2.5 2.5 0 0 1 13.5 14h-2.69l-3.2 2.94A.75.75 0 0 1 6.5 16.4V14H6.5A2.5 2.5 0 0 1 4 11.5v-6A2.5 2.5 0 0 1 6.5 3H9v-.5a1 1 0 0 1 1-1ZM7.75 7a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm4.5 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z"
        clipRule="evenodd"
      />
    ),
  },
  {
    href: "/configuration",
    label: "Configuration",
    adminOnly: true,
    icon: (
      <path
        fillRule="evenodd"
        d="M8.34 1.8a1 1 0 0 1 .94-.67h1.44a1 1 0 0 1 .94.67l.3.86a6.5 6.5 0 0 1 1.32.76l.9-.18a1 1 0 0 1 1.06.49l.72 1.24a1 1 0 0 1-.12 1.16l-.6.68c.05.25.07.5.07.76s-.02.51-.07.76l.6.68a1 1 0 0 1 .12 1.16l-.72 1.24a1 1 0 0 1-1.06.49l-.9-.18c-.41.32-.85.57-1.32.76l-.3.86a1 1 0 0 1-.94.67H9.28a1 1 0 0 1-.94-.67l-.3-.86a6.5 6.5 0 0 1-1.32-.76l-.9.18a1 1 0 0 1-1.06-.49l-.72-1.24a1 1 0 0 1 .12-1.16l.6-.68a4.7 4.7 0 0 1 0-1.52l-.6-.68a1 1 0 0 1-.12-1.16l.72-1.24a1 1 0 0 1 1.06-.49l.9.18c.41-.32.85-.57 1.32-.76l.3-.86ZM10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"
        clipRule="evenodd"
      />
    ),
  },
];

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const roles = useAppSelector((s) => s.auth.roles);
  const isAdmin = roles.includes("ADMIN");

  const items = NAV.filter((item) => !item.adminOnly || isAdmin);

  return (
    <aside className="flex h-full w-64 flex-col border-r border-zinc-200 bg-white">
      <div className="flex h-16 items-center gap-2 border-b border-zinc-100 px-5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
          A
        </span>
        <span className="text-lg font-semibold tracking-tight text-zinc-900">
          Integration
        </span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {items.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
              }`}
            >
              <svg
                className={`h-5 w-5 shrink-0 ${
                  active ? "text-indigo-600" : "text-zinc-400"
                }`}
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                {item.icon}
              </svg>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
