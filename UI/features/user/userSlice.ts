/**
 * The one piece of app state: the details this device has on file.
 *
 * There are no credentials here. The device *is* the identity (see
 * lib/machineId.ts), so "logging in" means submitting name / phone / UPI, and
 * being "logged in" means the server recognises this machine id.
 */

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  fetchUserForDevice,
  saveUserDetails,
  updateUserDetails,
  type SavedUser,
  type UserDetails,
} from "@/lib/userDetails";

export interface UserState {
  user: SavedUser | null;
  /** True once the device lookup has settled, either way. */
  initialized: boolean;
  /** Set when the lookup itself failed — a server we couldn't reach, not a missing user. */
  loadError: string | null;
}

const initialState: UserState = {
  user: null,
  initialized: false,
  loadError: null,
};

/** Ask the server who this device belongs to. Runs once, on first mount. */
export const bootstrapUser = createAsyncThunk<SavedUser | null>(
  "user/bootstrap",
  async () => fetchUserForDevice()
);

/** Submit the details for a device the server doesn't know yet. */
export const registerUser = createAsyncThunk<SavedUser, UserDetails>(
  "user/register",
  async (values) => saveUserDetails(values)
);

/** Change the details already on file for this device. */
export const updateUser = createAsyncThunk<SavedUser, UserDetails>(
  "user/update",
  async (values) => updateUserDetails(values)
);

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(bootstrapUser.fulfilled, (state, action) => {
        state.initialized = true;
        state.loadError = null;
        state.user = action.payload;
      })
      // A failed lookup is not a missing user: leave `user` null but record why,
      // so the UI can offer a retry instead of demanding the details again.
      .addCase(bootstrapUser.rejected, (state, action) => {
        state.initialized = true;
        state.loadError = action.error.message ?? "Unable to reach the server.";
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.initialized = true;
        state.loadError = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.user = action.payload;
      });
  },
});

export default userSlice.reducer;
