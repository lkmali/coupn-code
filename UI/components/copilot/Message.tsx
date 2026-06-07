"use client";

/**
 * A single chat bubble. User turns are right-aligned in indigo; assistant turns
 * are left-aligned on white. Content is rendered as plain text (whitespace
 * preserved) — the backend formats lists/tables in Markdown, shown verbatim.
 */

import type { ChatMessage } from "@/features/copilot/types";

export default function Message({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "bg-indigo-600 text-white"
            : "border border-zinc-200 bg-white text-zinc-800"
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}
