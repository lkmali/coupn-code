"use client";

/**
 * Admin User Management — list, search/filter, create users and toggle their
 * active status. Non-admins are redirected away.
 */

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { loadUsers, setUserStatus } from "@/features/users/usersSlice";
import {
  selectUsers,
  selectUsersCount,
  selectUsersError,
  selectUsersStatus,
} from "@/features/users/usersSelectors";
import { selectIsAdmin } from "@/features/auth/authSelectors";
import CreateUserModal from "@/components/CreateUserModal";
import Spinner from "@/components/Spinner";
import Toast from "@/components/Toast";
import type { UserStatus } from "@/lib/types";

const PAGE_SIZE = 10;

export default function UsersPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const isAdmin = useAppSelector(selectIsAdmin);
  const rows = useAppSelector(selectUsers);
  const count = useAppSelector(selectUsersCount);
  const status = useAppSelector(selectUsersStatus);
  const error = useAppSelector(selectUsersError);

  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">(
    "all"
  );
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (isAdmin === false) router.replace("/dashboard");
  }, [isAdmin, router]);

  const query = useMemo(
    () => ({
      pageNumber: page,
      limit: PAGE_SIZE,
      search: search.trim() || undefined,
      isActive:
        activeFilter === "all" ? undefined : activeFilter === "active",
    }),
    [page, search, activeFilter]
  );

  useEffect(() => {
    if (!isAdmin) return;
    const id = setTimeout(() => dispatch(loadUsers(query)), 250);
    return () => clearTimeout(id);
  }, [dispatch, isAdmin, query]);

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  async function toggleStatus(userId: string, current: boolean) {
    const next: UserStatus = current ? "INACTIVE" : "ACTIVE";
    setBusyId(userId);
    const result = await dispatch(setUserStatus({ userId, status: next }));
    setBusyId(null);
    if (setUserStatus.fulfilled.match(result)) {
      setToast(`User ${next === "ACTIVE" ? "activated" : "deactivated"}.`);
    }
  }

  if (!isAdmin) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            User Management
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Create users and manage their access.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 5a.75.75 0 01.75.75v3.5h3.5a.75.75 0 010 1.5h-3.5v3.5a.75.75 0 01-1.5 0v-3.5h-3.5a.75.75 0 010-1.5h3.5v-3.5A.75.75 0 0110 5z" />
          </svg>
          New User
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name or email…"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-white p-1">
          {(["all", "active", "inactive"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => {
                setActiveFilter(f);
                setPage(1);
              }}
              className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                activeFilter === f
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
        {status === "loading" && rows.length === 0 ? (
          <Spinner label="Loading users…" />
        ) : rows.length === 0 ? (
          <div className="py-16 text-center text-sm text-zinc-500">
            No users found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-xs uppercase tracking-wide text-zinc-500">
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Email</th>
                  <th className="px-5 py-3 font-medium">Role</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((u) =>{

                    console.log("uuuuuu",u)
                    return  (
                  <tr
                    key={u.userId}
                    className="border-b border-zinc-50 last:border-b-0 hover:bg-zinc-50/50"
                  >
                    <td className="px-5 py-3.5 font-medium text-zinc-900">
                      {u.userName}
                    </td>
                    <td className="px-5 py-3.5 text-zinc-600">{u.email}</td>
                    <td className="px-5 py-3.5 text-zinc-600">
                      {u.roles?.map(value=>value)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          u.isActive
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {u.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => toggleStatus(u.userId, u.isActive)}
                        disabled={busyId === u.userId}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                          u.isActive
                            ? "border-red-200 text-red-600 hover:bg-red-50"
                            : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                        }`}
                      >
                        {busyId === u.userId
                          ? "…"
                          : u.isActive
                            ? "Deactivate"
                            : "Activate"}
                      </button>
                    </td>
                  </tr>
                )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-zinc-500">
        <span>
          {count} user{count === 1 ? "" : "s"} total
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-lg border border-zinc-200 px-3 py-1.5 font-medium text-zinc-600 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-2">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="rounded-lg border border-zinc-200 px-3 py-1.5 font-medium text-zinc-600 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      <CreateUserModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={(msg) => {
          setToast(msg);
          dispatch(loadUsers(query));
        }}
      />

      <Toast message={toast} onDone={() => setToast(null)} />
    </div>
  );
}
