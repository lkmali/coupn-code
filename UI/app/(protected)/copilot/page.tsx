"use client";

/**
 * Copilot — the dashboard chat assistant. Ask natural-language questions about
 * orders, the product catalog and Stripe billing; the backend resolves them via
 * org-scoped, read-only tools and replies in Markdown.
 */

import ChatWindow from "@/components/copilot/ChatWindow";

export default function CopilotPage() {
  return (
    <div className="flex h-[calc(100vh-9rem)] flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Copilot
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Ask about your orders, products and billing in plain language.
        </p>
      </div>
      <div className="min-h-0 flex-1">
        <ChatWindow />
      </div>
    </div>
  );
}
