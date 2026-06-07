/** A chat turn. `system` is server-managed and never created in the UI. */
export type ChatRole = "user" | "assistant" | "system";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

/** Request body for POST /copilot/chat. */
export interface ChatRequest {
  messages: ChatMessage[];
  conversationId?: string;
}

/** `data` payload of the chat response. */
export interface ChatResult {
  reply: string;
  toolsUsed: string[];
}
