/**
 * Configuration selectors.
 */

import type { RootState } from "@/store/store";

export const selectConfig = (s: RootState) => s.config.data;
export const selectConfigStatus = (s: RootState) => s.config.status;
export const selectConfigSaving = (s: RootState) => s.config.saving;
export const selectConfigError = (s: RootState) => s.config.error;
export const selectConfigSavedAt = (s: RootState) => s.config.savedAt;
