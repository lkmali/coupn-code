"use client";

/**
 * Home / dashboard. Greets the user and surfaces quick links — admin users get
 * shortcuts to User Management and Configuration.
 */

import Link from "next/link";
import { useAppSelector } from "@/store/hooks";
import { selectAuthUser, selectIsAdmin } from "@/features/auth/authSelectors";

export default function HomePage() {
  const user = useAppSelector(selectAuthUser);
  const isAdmin = useAppSelector(selectIsAdmin);

  const cards = [
    {
      href: "/profile",
      title: "My Profile",
      description: "View your account details and contact information.",
      show: true,
    },
    {
      href: "/users",
      title: "User Management",
      description: "Create users and activate or deactivate accounts.",
      show: isAdmin,
    },
    {
      href: "/configuration",
      title: "Configuration",
      description: "Set the organization data used in outbound API requests.",
      show: isAdmin,
    },
  ].filter((c) => c.show);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Welcome back, {user?.userName?.split(" ")[0] || "there"} 👋
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          {isAdmin
            ? "You have administrator access to this organization."
            : "Here's your account overview."}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group rounded-2xl border border-zinc-200 bg-white p-6 transition-all hover:border-indigo-200 hover:shadow-md"
          >
            <h2 className="text-base font-semibold text-zinc-900 group-hover:text-indigo-700">
              {card.title}
            </h2>
            <p className="mt-2 text-sm text-zinc-500">{card.description}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-indigo-600">
              Open
              <svg
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M7.21 14.77a.75.75 0 01.02-1.06L11.17 10 7.23 6.29a.75.75 0 011.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
