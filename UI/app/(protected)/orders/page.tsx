"use client";

/**
 * Orders overview — summary cards plus a searchable, filterable table of orders
 * with their reconciled payment information. Clicking a row opens a detail
 * drawer with the full payment breakdown (and a refund action for admins).
 * Admins see every order in the org; regular users only see their own (the
 * backend enforces the scoping). Supports status filtering and pagination.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { listOrders } from "@/features/payments/paymentsApi";
import type {
  OrderListItem,
  OrderStatus,
  PaymentStatus,
} from "@/features/payments/types";
import { getErrorMessage } from "@/lib/api";
import { useAppSelector } from "@/store/hooks";
import { selectIsAdmin } from "@/features/auth/authSelectors";
import Spinner from "@/components/Spinner";
import Toast from "@/components/Toast";
import OrderDetailDrawer from "@/components/payments/OrderDetailDrawer";

const PAGE_SIZE = 10;

const ORDER_FILTERS: Array<"all" | OrderStatus> = [
  "all",
  "PENDING",
  "PROCESSING",
  "PAID",
  "FAILED",
  "REFUNDED",
];

function formatAmount(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  } catch {
    return `${(amount / 100).toFixed(2)} ${currency.toUpperCase()}`;
  }
}

function formatDate(value: string): string {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

const ORDER_BADGE: Record<OrderStatus, string> = {
  PENDING: "bg-zinc-100 text-zinc-600",
  PROCESSING: "bg-amber-50 text-amber-700",
  PAID: "bg-emerald-50 text-emerald-700",
  FAILED: "bg-red-50 text-red-700",
  REFUNDED: "bg-indigo-50 text-indigo-700",
};

const PAYMENT_BADGE: Record<PaymentStatus, string> = {
  PENDING: "bg-zinc-100 text-zinc-600",
  PROCESSING: "bg-amber-50 text-amber-700",
  SUCCEEDED: "bg-emerald-50 text-emerald-700",
  FAILED: "bg-red-50 text-red-700",
  REFUNDED: "bg-indigo-50 text-indigo-700",
  CANCELED: "bg-zinc-100 text-zinc-500",
};

function StatusBadge({ label, className }: { label: string; className: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}
    >
      {label}
    </span>
  );
}

/** A single headline metric card. */
function StatCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
        {label}
      </p>
      <p
        className={`mt-1.5 text-2xl font-semibold tracking-tight ${
          accent ?? "text-zinc-900"
        }`}
      >
        {value}
      </p>
      {hint && <p className="mt-0.5 text-xs text-zinc-400">{hint}</p>}
    </div>
  );
}

export default function OrdersPage() {
  const isAdmin = useAppSelector(selectIsAdmin);

  const [rows, setRows] = useState<OrderListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<OrderListItem | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listOrders({
        pageNumber: page,
        limit: PAGE_SIZE,
        status: statusFilter === "all" ? undefined : statusFilter,
      });
      setRows(result.items);
      setTotal(result.total);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Client-side search over the loaded page (order id / product name).
  const visibleRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (o) =>
        o.orderId.toLowerCase().includes(q) ||
        (o.productName ?? "").toLowerCase().includes(q)
    );
  }, [rows, query]);

  // Quick stats for the current page of orders.
  const stats = useMemo(() => {
    const paid = rows.filter((o) => o.status === "PAID");
    const processing = rows.filter((o) => o.status === "PROCESSING").length;
    const currency = rows[0]?.currency ?? "usd";
    const collected = paid.reduce(
      (sum, o) => sum + (o.payment?.amount ?? o.amount),
      0
    );
    return {
      paid: paid.length,
      processing,
      collected,
      currency,
    };
  }, [rows]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Orders
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            All orders with their current status and payment information. Click a
            row to see the full detail.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.5 8a5.5 5.5 0 10-1.2 4.9M15.5 4v4h-4"
            />
          </svg>
          Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total orders" value={String(total)} hint="across all pages" />
        <StatCard
          label="Paid"
          value={String(stats.paid)}
          hint="on this page"
          accent="text-emerald-600"
        />
        <StatCard
          label="Processing"
          value={String(stats.processing)}
          hint="on this page"
          accent="text-amber-600"
        />
        <StatCard
          label="Collected"
          value={formatAmount(stats.collected, stats.currency)}
          hint="paid, on this page"
        />
      </div>

      {/* Controls: search + status filter */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative lg:w-72">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          >
            <circle cx="9" cy="9" r="6" />
            <path strokeLinecap="round" d="M14 14l3 3" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search order ID or product…"
            className="w-full rounded-lg border border-zinc-300 py-2.5 pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1 rounded-lg border border-zinc-200 bg-white p-1">
          {ORDER_FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => {
                setStatusFilter(f);
                setPage(1);
              }}
              className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                statusFilter === f
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              {f === "all" ? "All" : f.toLowerCase()}
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
        {loading && rows.length === 0 ? (
          <Spinner label="Loading orders…" />
        ) : visibleRows.length === 0 ? (
          <div className="py-16 text-center text-sm text-zinc-500">
            {query.trim() ? "No orders match your search." : "No orders found."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-xs uppercase tracking-wide text-zinc-500">
                  <th className="px-5 py-3 font-medium">Order</th>
                  <th className="px-5 py-3 font-medium">Product</th>
                  <th className="px-5 py-3 font-medium">Amount</th>
                  <th className="px-5 py-3 font-medium">Order status</th>
                  <th className="px-5 py-3 font-medium">Payment</th>
                  <th className="px-5 py-3 font-medium">Refunded</th>
                  <th className="px-5 py-3 font-medium">Created</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((o) => (
                  <tr
                    key={o.orderId}
                    onClick={() => setSelected(o)}
                    className="group cursor-pointer border-b border-zinc-50 last:border-b-0 transition-colors hover:bg-indigo-50/40"
                  >
                    <td className="px-5 py-3.5 font-mono text-xs text-zinc-500">
                      {o.orderId}
                    </td>
                    <td className="px-5 py-3.5 text-zinc-700">
                      {o.productName ?? "—"}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-zinc-900">
                      {formatAmount(o.amount, o.currency)}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge
                        label={o.status}
                        className={ORDER_BADGE[o.status]}
                      />
                    </td>
                    <td className="px-5 py-3.5">
                      {o.payment ? (
                        <StatusBadge
                          label={o.payment.status}
                          className={PAYMENT_BADGE[o.payment.status]}
                        />
                      ) : (
                        <span className="text-xs text-zinc-400">No payment</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-zinc-600">
                      {o.payment && o.payment.amountRefunded > 0
                        ? formatAmount(o.payment.amountRefunded, o.payment.currency)
                        : "—"}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-zinc-500">
                      {formatDate(o.createdAt)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="text-zinc-300 transition-colors group-hover:text-zinc-500">
                        <svg
                          className="inline h-4 w-4"
                          viewBox="0 0 20 20"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.6"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M7.5 5l5 5-5 5"
                          />
                        </svg>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-zinc-500">
        <span>
          {total} order{total === 1 ? "" : "s"} total
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

      {/* Detail drawer */}
      <OrderDetailDrawer
        order={selected}
        isAdmin={isAdmin}
        onClose={() => setSelected(null)}
        onRefunded={(message) => {
          setSelected(null);
          setToast(message);
          load();
        }}
      />

      <Toast message={toast} onDone={() => setToast(null)} />
    </div>
  );
}
