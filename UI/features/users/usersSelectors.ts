/**
 * Users selectors.
 */

import type { RootState } from "@/store/store";

export const selectUsers = (s: RootState) => s.users.rows;
export const selectUsersCount = (s: RootState) => s.users.count;
export const selectUsersQuery = (s: RootState) => s.users.query;
export const selectUsersStatus = (s: RootState) => s.users.status;
export const selectUsersMutating = (s: RootState) => s.users.mutating;
export const selectUsersError = (s: RootState) => s.users.error;
