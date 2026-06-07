/**
 * Copilot chat API calls.
 *
 * The backend wraps successful responses as `{ success: true, data: ... }`, so
 * the helper unwraps `.data.data`.
 */

import { api } from "@/lib/api";
import type { ChatMessage, ChatResult } from "./types";

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

/** POST /copilot/chat — send the running transcript, get the assistant reply. */
export async function sendChat(
  messages: ChatMessage[],
  conversationId?: string
): Promise<ChatResult> {
  const { data } = await api.post<ApiEnvelope<ChatResult>>("/copilot/chat", {
    messages,
    conversationId,
  });
  return data.data;
}
