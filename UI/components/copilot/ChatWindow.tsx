"use client";

/**
 * The copilot chat surface: scrollable transcript + composer. Holds the
 * conversation in local state, sends the full transcript to the backend on each
 * turn, and appends the assistant reply. Errors surface as an assistant-styled
 * notice so the thread stays readable.
 */

import { useEffect, useRef, useState } from "react";
import Message from "./Message";
import ChatInput from "./ChatInput";
import { sendChat } from "@/features/copilot/copilotApi";
import type { ChatMessage } from "@/features/copilot/types";
import { getErrorMessage } from "@/lib/api";

const GREETING: ChatMessage = {
  role: "assistant",
  content:
    "Hi! I'm your dashboard copilot. Ask me about your orders, product catalog or billing — for example, “How many paid orders do I have?” or “What subscription plans do we offer?”",
};

/** Predefined prompts, grouped by the tool/integration that answers them. */
const PROMPT_GROUPS = [
  {
    tool: "MongoDB",
    prompts: [
      "Show my applications",
      "Show my latest order",
      "What is my highest order",
      "How many orders do I have",
    ],
  },
  {
    tool: "Stripe",
    prompts: [
      "Show my active plan",
      "Show my invoices",
      "When does my subscription expire",
    ],
  },
];

export default function ChatWindow() {
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Keep the latest message in view.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  async function handleSend(text: string) {
    const userMsg: ChatMessage = { role: "user", content: text };
    // Transcript sent to the server excludes the local-only greeting.
    const history = [...messages, userMsg].filter((m) => m !== GREETING);
    setMessages((prev) => [...prev, userMsg]);
    setSending(true);

    try {
      const { reply } = await sendChat(history);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `⚠️ ${getErrorMessage(err)}` },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50">
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.map((m, i) => (
          <Message key={i} message={m} />
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="inline-flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-500">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-200 border-t-indigo-600" />
              Thinking…
            </div>
          </div>
        )}
      </div>
      {/* Predefined prompt chips, grouped by tool — always available as shortcuts. */}
      <div className="space-y-2 px-4 pb-1 pt-2">
        {PROMPT_GROUPS.map((group) => (
          <div key={group.tool} className="space-y-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
              {group.tool}
            </span>
            <div className="flex flex-wrap gap-2">
              {group.prompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => handleSend(prompt)}
                  disabled={sending}
                  className="rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-700 transition-colors hover:border-indigo-500 hover:bg-indigo-50 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <ChatInput onSend={handleSend} disabled={sending} />
    </div>
  );
}
