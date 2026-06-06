/**
 * Configuration slice — organization data used in outbound API requests
 * (meta attributes, phone numbers, address, keys).
 */

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { getErrorMessage } from "@/lib/api";
import {
  fetchOrganizationConfig,
  saveOrganizationConfig,
} from "./configApi";
import type { OrganizationConfiguration } from "@/lib/types";

export interface ConfigState {
  data: OrganizationConfiguration | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  saving: boolean;
  error: string | null;
  savedAt: number | null;
}

const initialState: ConfigState = {
  data: null,
  status: "idle",
  saving: false,
  error: null,
  savedAt: null,
};

export const loadConfig = createAsyncThunk<
  OrganizationConfiguration,
  void,
  { rejectValue: string }
>("config/load", async (_, { rejectWithValue }) => {
  try {
    return await fetchOrganizationConfig();
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

export const saveConfig = createAsyncThunk<
  OrganizationConfiguration,
  OrganizationConfiguration,
  { rejectValue: string }
>("config/save", async (payload, { rejectWithValue }) => {
  try {
    return await saveOrganizationConfig(payload);
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

const configSlice = createSlice({
  name: "config",
  initialState,
  reducers: {
    clearConfigError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadConfig.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(loadConfig.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.data = action.payload;
      })
      .addCase(loadConfig.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Failed to load configuration";
      })
      .addCase(saveConfig.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(saveConfig.fulfilled, (state, action) => {
        state.saving = false;
        state.data = action.payload ?? state.data;
        state.savedAt = Date.now();
      })
      .addCase(saveConfig.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload ?? "Failed to save configuration";
      });
  },
});

export const { clearConfigError } = configSlice.actions;
export default configSlice.reducer;
