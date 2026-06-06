/**
 * Auth selectors — read auth state from the store in a typed, reusable way.
 */

import type { RootState } from "@/store/store";

export const selectAuthUser = (s: RootState) => s.auth.user;
export const selectAuthRoles = (s: RootState) => s.auth.roles;
export const selectIsAdmin = (s: RootState) => s.auth.roles.includes("ADMIN");
export const selectAuthInitialized = (s: RootState) => s.auth.initialized;
export const selectAuthStatus = (s: RootState) => s.auth.status;
export const selectAuthError = (s: RootState) => s.auth.error;
export const selectIsAuthenticated = (s: RootState) => Boolean(s.auth.user);
