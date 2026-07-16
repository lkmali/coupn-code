"use client";

/**
 * Wraps the app in the Redux store and looks up this device's details once, on
 * first mount, before any page decides what to render.
 */

import { useEffect } from "react";
import { Provider } from "react-redux";
import { store } from "@/store/store";
import { useAppDispatch } from "@/store/hooks";
import { bootstrapUser } from "@/features/user/userSlice";

function UserBootstrap({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    void dispatch(bootstrapUser());
  }, [dispatch]);

  return <>{children}</>;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <UserBootstrap>{children}</UserBootstrap>
    </Provider>
  );
}
