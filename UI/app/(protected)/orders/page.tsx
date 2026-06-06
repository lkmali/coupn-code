"use client";

/**
 * Orders overview — a table of orders with their status and the reconciled
 * payment information. Admins see every order in the org; regular users only see
 * their own (the backend enforces the scoping). Supports status filtering and
 * pagination.
 */

import { useCallback, useEffect, useState } from "react";
import { listOrders } from "@/features/payments/paymentsApi";
import type {
  OrderListItem,
  OrderStatus,
  PaymentStatus,
} from "@/features/payments/types";
import { getErrorMessage } from "@/lib/api";
import Spinner from "@/components/Spinner";

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

export default function OrdersPage() {
  const [rows, setRows] = useState<OrderListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");
  const [page, setPage] = useState(1);

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Orders
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            All orders with their current status and payment information.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
        >
          Refresh
        </button>
      </div>

      {/* Status filter */}
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

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
        {loading && rows.length === 0 ? (
          <Spinner label="Loading orders…" />
        ) : rows.length === 0 ? (
          <div className="py-16 text-center text-sm text-zinc-500">
            No orders found.
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
                </tr>
              </thead>
              <tbody>
                {rows.map((o) => (
                  <tr
                    key={o.orderId}
                    className="border-b border-zinc-50 last:border-b-0 hover:bg-zinc-50/50"
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
    </div>
  );
}
