/**
 * Copilot module — the dashboard chat assistant.
 *
 *   OpenAIService   – thin singleton wrapper around the OpenAI SDK
 *   CopilotService  – orchestrates the tool-calling loop for one chat turn
 *   tools/          – read-only, org-scoped tools (orders, products, Stripe)
 *
 * New capabilities should be added as tools under ./tools and registered in
 * ./tools/index.ts, so the orchestrator picks them up automatically.
 */
export * from './openai.service'
export * from './copilot.service'
export * from './tools'
