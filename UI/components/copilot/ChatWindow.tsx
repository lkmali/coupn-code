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
      <ChatInput onSend={handleSend} disabled={sending} />
    </div>
  );
}
