/**
 * Centralized Axios HTTP client.
 *
 * - Base URL comes from NEXT_PUBLIC_API_BASE_URL (defaults to same-origin "/api").
 * - A response interceptor unwraps errors into a readable message.
 *
 * There are no auth headers: the device identifies itself with the machineId it
 * sends on each /user call (see lib/machineId.ts), so there is no token to hold.
 */

import axios, { AxiosError } from "axios";

// Same-origin relative path: when the UI is served by the backend (static export
// under Express) "/api" hits the same host/port, so there is no CORS and no
// cross-port routing to get wrong. For `next dev` (separate port) set
// NEXT_PUBLIC_API_BASE_URL in UI/.env.development to the backend URL.
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string }>) =>
    Promise.reject(new Error(getErrorMessage(error)))
);

/** Extract a human readable message out of an axios error. */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined;
    if (data?.message) return data.message;
    if (error.message) return error.message;
  }
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}
