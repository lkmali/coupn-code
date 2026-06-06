/**
 * Redux store configuration (combines all feature reducers).
 */

import { configureStore } from "@reduxjs/toolkit";
import authReducer from "@/features/auth/authSlice";
import usersReducer from "@/features/users/usersSlice";
import configReducer from "@/features/config/configSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    users: usersReducer,
    config: configReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
