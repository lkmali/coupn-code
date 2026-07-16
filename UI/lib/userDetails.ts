/**
 * The name / phone / UPI details collected on first visit, keyed to the device.
 *
 * Validation here is pattern-only by design, and mirrors src/constants/patterns.ts
 * on the server: we check the shape of what was typed, not that the number is
 * reachable or that the UPI handle resolves. Keep the two files in step.
 */

import { api, getErrorMessage } from "./api";
import { getDeviceIdentity } from "./machineId";

export const USER_NAME_PATTERN = /^[a-zA-Z\s'-]+$/;
export const MOBILE_NUMBER_PATTERN = /^(\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}$/;
export const UPI_ID_PATTERN = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;

export interface UserDetails {
  userName: string;
  mobileNumber: string;
  upiId: string;
}

export interface SavedUser extends UserDetails {
  userId: string;
}

export type UserDetailsErrors = Partial<Record<keyof UserDetails, string>>;

/** Field-by-field shape check. An empty object means the form is submittable. */
export function validateUserDetails(values: UserDetails): UserDetailsErrors {
  const errors: UserDetailsErrors = {};

  const userName = values.userName.trim();
  if (userName.length < 2) {
    errors.userName = "Full name must be at least 2 characters";
  } else if (userName.length > 60) {
    errors.userName = "Full name must be less than 60 characters";
  } else if (!USER_NAME_PATTERN.test(userName)) {
    errors.userName =
      "Full name can only contain letters, spaces, hyphens, and apostrophes";
  }

  if (!values.mobileNumber.trim()) {
    errors.mobileNumber = "Phone number is required";
  } else if (!MOBILE_NUMBER_PATTERN.test(values.mobileNumber.trim())) {
    errors.mobileNumber = "Enter a valid Indian phone number (e.g. +91 98765 43210)";
  }

  if (!values.upiId.trim()) {
    errors.upiId = "UPI ID is required";
  } else if (!UPI_ID_PATTERN.test(values.upiId.trim())) {
    errors.upiId = "Enter a valid UPI ID (e.g. yourname@upi)";
  }

  return errors;
}

/* --------------------------------- api ---------------------------------- */

/**
 * Who is this browser? `null` means unknown — the caller should show the popup.
 */
export async function fetchUserForDevice(): Promise<SavedUser | null> {
  try {
    const { machineId, fingerprint } = getDeviceIdentity();
    const response = await api.get<{ user: SavedUser | null }>("/user", {
      params: { machineId, ...(fingerprint ? { fingerprint } : {}) },
    });
    return response.data.user ?? null;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function saveUserDetails(values: UserDetails): Promise<SavedUser> {
  try {
    const { machineId, fingerprint } = getDeviceIdentity();
    const response = await api.post<{ user: SavedUser }>("/user", {
      userName: values.userName.trim(),
      mobileNumber: values.mobileNumber.trim(),
      upiId: values.upiId.trim(),
      machineId,
      ...(fingerprint ? { fingerprint } : {}),
    });
    return response.data.user;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function updateUserDetails(values: UserDetails): Promise<SavedUser> {
  try {
    const { machineId } = getDeviceIdentity();
    const response = await api.put<{ user: SavedUser }>("/user", {
      userName: values.userName.trim(),
      mobileNumber: values.mobileNumber.trim(),
      upiId: values.upiId.trim(),
      machineId,
    });
    return response.data.user;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}
