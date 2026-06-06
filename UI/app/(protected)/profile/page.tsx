"use client";

/**
 * Profile page — shows the logged-in user's information.
 */

import { useAppSelector } from "@/store/hooks";
import { selectAuthRoles, selectAuthUser } from "@/features/auth/authSelectors";

function Field({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-b border-zinc-100 py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm font-medium text-zinc-500">{label}</span>
      <span className="text-sm text-zinc-900">{value || "—"}</span>
    </div>
  );
}

export default function ProfilePage() {
  const user = useAppSelector(selectAuthUser);
  const roles = useAppSelector(selectAuthRoles);

  if (!user) return null;

  const initials = user.userName
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const roleLabel = roles.includes("ADMIN") ? "ADMIN" : user.role || "USER";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          My Profile
        </h1>
        <p className="mt-1 text-sm text-zinc-500">Your account information.</p>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6">
        <div className="flex items-center gap-4 border-b border-zinc-100 pb-6">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-600 text-xl font-semibold text-white">
            {initials || "U"}
          </span>
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">
              {user.userName}
            </h2>
            <p className="text-sm text-zinc-500">{user.email}</p>
            <span className="mt-2 inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
              {roleLabel}
            </span>
          </div>
        </div>

        <div className="pt-2">
          <Field label="Full name" value={user.userName} />
          <Field label="Email" value={user.email} />
          <Field label="Mobile number" value={user.mobileNumber} />
          <Field label="Role" value={roleLabel} />
          <Field
            label="Status"
            value={
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  user.isActive === false
                    ? "bg-red-50 text-red-700"
                    : "bg-emerald-50 text-emerald-700"
                }`}
              >
                {user.isActive === false ? "Inactive" : "Active"}
              </span>
            }
          />
          {user.experienceYears != null && (
            <Field
              label="Experience"
              value={`${user.experienceYears} years`}
            />
          )}
          {user.specialization?.length ? (
            <Field
              label="Specialization"
              value={user.specialization.join(", ")}
            />
          ) : null}
          {user.languagesSpoken?.length ? (
            <Field
              label="Languages"
              value={user.languagesSpoken.join(", ")}
            />
          ) : null}
          {user.qualifications?.length ? (
            <Field
              label="Qualifications"
              value={user.qualifications.join(", ")}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
