"use client";

/**
 * Tiny auto-dismissing toast. Render it when `message` is set; it clears itself
 * by calling `onDone` after a few seconds.
 */

import { useEffect } from "react";

interface Props {
  message: string | null;
  variant?: "success" | "error";
  onDone: () => void;
}

export default function Toast({ message, variant = "success", onDone }: Props) {
  useEffect(() => {
    if (!message) return;
    const id = setTimeout(onDone, 3500);
    return () => clearTimeout(id);
  }, [message, onDone]);

  if (!message) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <div
        className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm shadow-lg ${
          variant === "error"
            ? "border-red-200 bg-red-50 text-red-700"
            : "border-emerald-200 bg-emerald-50 text-emerald-700"
        }`}
      >
        {message}
      </div>
    </div>
  );
}
