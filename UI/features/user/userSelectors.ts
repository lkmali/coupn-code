/**
 * Selectors for the device's user details.
 */

import type { RootState } from "@/store/store";

export const selectUser = (s: RootState) => s.user.user;
export const selectUserInitialized = (s: RootState) => s.user.initialized;
export const selectUserLoadError = (s: RootState) => s.user.loadError;

/**
 * Are the details complete? A record only reaches the client once the server
 * has all three fields, so its presence is the whole check.
 */
export const selectHasDetails = (s: RootState) => Boolean(s.user.user);
