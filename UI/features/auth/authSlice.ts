/**
 * Auth slice — owns the logged-in user, role flags and login/logout flow.
 */

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { getErrorMessage, session } from "@/lib/api";
import { fetchMyProfile, loginWithPassword } from "./authApi";
import type { Role, UserProfile } from "@/lib/types";

export interface AuthState {
  user: UserProfile | null;
  roles: Role[];
  status: "idle" | "loading" | "succeeded" | "failed";
  /** True once we have checked localStorage / fetched the profile at least once. */
  initialized: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  roles: [],
  status: "idle",
  initialized: false,
  error: null,
};

/** Email + password login, followed by loading the full profile. */
export const login = createAsyncThunk<
  { user: UserProfile; roles: Role[] },
  { email: string; password: string },
  { rejectValue: string }
>("auth/login", async ({ email, password }, { rejectWithValue }) => {
  try {
    const res = await loginWithPassword(email, password);
    session.setToken(res.token);
    session.setRoles(res.roles ?? []);
    const user = await fetchMyProfile();
    session.setUser(user);
    return { user, roles: res.roles ?? [] };
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

/** Restore the session from a stored token on first load. */
export const bootstrapAuth = createAsyncThunk<
  { user: UserProfile; roles: Role[] } | null
>("auth/bootstrap", async () => {
  if (!session.getToken()) return null;
  const roles = session.getRoles() as Role[];
  const user = await fetchMyProfile();
  session.setUser(user);
  return { user, roles };
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      session.clear();
      state.user = null;
      state.roles = [];
      state.status = "idle";
      state.error = null;
    },
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload.user;
        state.roles = action.payload.roles;
        state.initialized = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Login failed";
      })
      .addCase(bootstrapAuth.fulfilled, (state, action) => {
        state.initialized = true;
        if (action.payload) {
          state.user = action.payload.user;
          state.roles = action.payload.roles;
        }
      })
      .addCase(bootstrapAuth.rejected, (state) => {
        state.initialized = true;
        session.clear();
        state.user = null;
        state.roles = [];
      });
  },
});

export const { logout, clearAuthError } = authSlice.actions;
export default authSlice.reducer;
