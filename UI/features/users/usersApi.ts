/**
 * User management API calls (admin).
 */

import { api } from "@/lib/api";
import type {
  CreateUserPayload,
  PaginatedUsers,
  UserListItem,
  UserListQuery,
  UserStatus,
} from "@/lib/types";

/** Raw paginated envelope as produced by the backend's getPaginateData(). */
interface BackendPaginated<T> {
  data: T[];
  count: number;
  totalRecord: number;
  pageNumber: number;
}

/** GET /user — paginated, filterable user list. */
export async function fetchUsers(
  query: UserListQuery
): Promise<PaginatedUsers> {
  // The backend paginator returns the envelope { data: rows[], count, totalRecord,
  // pageNumber } DIRECTLY as the response body (no ApiEnvelope wrapper), where
  // `count` is this page's length and `totalRecord` is the grand total. Map it onto
  // the UI's { rows, count } contract so the table and pagination work.
  const { data: page } = await api.get<BackendPaginated<UserListItem>>(
    "/user/",
    { params: query }
  );
  return {
    rows: page?.data ?? [],
    count: page?.totalRecord ?? 0,
  };
}

/** POST /user — create a new user in the admin's organization. */
export async function createUser(
  payload: CreateUserPayload
): Promise<{ message: string }> {
  const { data } = await api.post<{ message: string }>("/user/", payload);
  return data;
}

/** PUT /user/:userId/status — activate or deactivate a user. */
export async function updateUserStatus(
  userId: string,
  status: UserStatus
): Promise<{ message: string }> {
  const { data } = await api.put<{ message: string }>(
    `/user/${userId}/status`,
    { status }
  );
  return data;
}
