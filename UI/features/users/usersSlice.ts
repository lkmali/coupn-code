/**
 * Users slice — admin user management: list, create, activate/inactivate.
 */

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { getErrorMessage } from "@/lib/api";
import {
  createUser as createUserApi,
  fetchUsers,
  updateUserStatus as updateUserStatusApi,
} from "./usersApi";
import type {
  CreateUserPayload,
  UserListItem,
  UserListQuery,
  UserStatus,
} from "@/lib/types";

export interface UsersState {
  rows: UserListItem[];
  count: number;
  query: UserListQuery;
  status: "idle" | "loading" | "succeeded" | "failed";
  mutating: boolean;
  error: string | null;
}

const initialState: UsersState = {
  rows: [],
  count: 0,
  query: { pageNumber: 1, limit: 10 },
  status: "idle",
  mutating: false,
  error: null,
};

export const loadUsers = createAsyncThunk<
  { rows: UserListItem[]; count: number },
  UserListQuery,
  { rejectValue: string }
>("users/load", async (query, { rejectWithValue }) => {
  try {
    return await fetchUsers(query);
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

export const createUser = createAsyncThunk<
  string,
  CreateUserPayload,
  { rejectValue: string }
>("users/create", async (payload, { rejectWithValue }) => {
  try {
    const res = await createUserApi(payload);
    return res.message;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

export const setUserStatus = createAsyncThunk<
  { userId: string; status: UserStatus },
  { userId: string; status: UserStatus },
  { rejectValue: string }
>("users/setStatus", async ({ userId, status }, { rejectWithValue }) => {
  try {
    await updateUserStatusApi(userId, status);
    return { userId, status };
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

const usersSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    setQuery(state, action: PayloadAction<Partial<UserListQuery>>) {
      state.query = { ...state.query, ...action.payload };
    },
    clearUsersError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadUsers.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(loadUsers.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.rows = action.payload.rows ?? [];
        state.count = action.payload.count ?? 0;
      })
      .addCase(loadUsers.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Failed to load users";
      })
      .addCase(createUser.pending, (state) => {
        state.mutating = true;
        state.error = null;
      })
      .addCase(createUser.fulfilled, (state) => {
        state.mutating = false;
      })
      .addCase(createUser.rejected, (state, action) => {
        state.mutating = false;
        state.error = action.payload ?? "Failed to create user";
      })
      .addCase(setUserStatus.pending, (state) => {
        state.error = null;
      })
      .addCase(setUserStatus.fulfilled, (state, action) => {
        const row = state.rows.find((r) => r.userId === action.payload.userId);
        if (row) row.isActive = action.payload.status === "ACTIVE";
      })
      .addCase(setUserStatus.rejected, (state, action) => {
        state.error = action.payload ?? "Failed to update status";
      });
  },
});

export const { setQuery, clearUsersError } = usersSlice.actions;
export default usersSlice.reducer;
