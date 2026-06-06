/**
 * Centralized Axios HTTP client.
 *
 * - Base URL comes from NEXT_PUBLIC_API_BASE_URL (defaults to same-origin "/api").
 * - A request interceptor attaches the stored JWT to every call.
 * - A response interceptor unwraps errors into a readable message and, on 401,
 *   clears the session and bounces the user back to the login page.
 */

import axios, { AxiosError, AxiosHeaders } from "axios";

// Same-origin relative path: when the UI is served by the backend (static export
// under Express) "/api" hits the same host/port, so there is no CORS and no
// cross-port routing to get wrong. For `next dev` (separate port) set
// NEXT_PUBLIC_API_BASE_URL in UI/.env.development to the backend URL.
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api";

const TOKEN_KEY = "app.token";
const USER_KEY = "app.user";
const ROLES_KEY = "app.roles";

/* ----------------------------- session storage ---------------------------- */

export const session = {
  getToken(): string | null {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(TOKEN_KEY);
  },
  setToken(token: string) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(TOKEN_KEY, token);
  },
  getRoles(): string[] {
    if (typeof window === "undefined") return [];
    const raw = window.localStorage.getItem(ROLES_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  },
  setRoles(roles: string[]) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(ROLES_KEY, JSON.stringify(roles));
  },
  getUser<T>(): T | null {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as T) : null;
  },
  setUser(user: unknown) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clear() {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
    window.localStorage.removeItem(ROLES_KEY);
  },
};

/* ------------------------------ axios instance ----------------------------- */

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const headers = AxiosHeaders.from(config.headers);

  // Never clobber an Authorization header the caller set explicitly. The login
  // call sends `Basic <email:password>`; if a stale token lingered in storage we
  // must NOT overwrite it with `Bearer <token>`, or the backend's basic-auth
  // strategy rejects the login with "Please supply a valid basic auth header."
  if (!headers.has("Authorization")) {
    const token = session.getToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  config.headers = headers;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string }>) => {
    const status = error.response?.status;

    // Session expired -> drop the session and return to login. Only bounce when
    // an authenticated session actually existed (a stored token): unauthenticated
    // pages (login, forgot-password, set-password) get meaningful 401s of their
    // own (bad credentials, unknown email, invalid OTP) and must surface them
    // inline instead of being redirected away.
    if (status === 401 && typeof window !== "undefined") {
      const hadToken = Boolean(session.getToken());
      session.clear();
      const onLogin = window.location.pathname.startsWith("/login");
      if (hadToken && !onLogin) window.location.assign("/login");
    }

    return Promise.reject(new Error(getErrorMessage(error)));
  }
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
