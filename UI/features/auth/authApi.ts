/**
 * Auth API calls (talks to the backend via the shared axios client).
 */

import { api } from "@/lib/api";
import type { LoginResponse, UserProfile } from "@/lib/types";

/** POST /auth/login using HTTP Basic auth (email:password). */
export async function loginWithPassword(
  email: string,
  password: string
): Promise<LoginResponse> {
  const basic =
    typeof window === "undefined"
      ? Buffer.from(`${email}:${password}`).toString("base64")
      : window.btoa(`${email}:${password}`);

  const { data } = await api.post<LoginResponse>(
    "/auth/login",
    {},
    { headers: { Authorization: `Basic ${basic}` } }
  );
  return data;
}

/** GET /user/profile -> the logged-in user's profile (returned raw, unwrapped). */
export async function fetchMyProfile(): Promise<UserProfile> {
  const { data } = await api.get<UserProfile>("/user/profile");
  return data;
}

/**
 * POST /auth/email/password/link — emails a reset link to the user. The link
 * lands on /account/set-password/{token}?email=... where the password is set.
 */
export async function requestPasswordResetLink(
  email: string
): Promise<{ message: string }> {
  const { data } = await api.post<{ message: string }>(
    "/auth/email/password/link",
    { email }
  );
  return data;
}

/**
 * POST /auth/email/password/set — sets a new password. `otp` is the encrypted
 * token taken from the reset link in the email; the backend decrypts it.
 */
export async function setPasswordWithOtp(
  email: string,
  password: string,
  otp: string
): Promise<{ message: string }> {
  const { data } = await api.post<{ message: string }>(
    "/auth/email/password/set",
    { email, password, otp }
  );
  return data;
}
