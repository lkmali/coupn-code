import { orderTools } from './orderTools'
import { productTools } from './productTools'
import { stripeTools } from './stripeTools'
import { CopilotTool, ToolContext, ToolDefinition } from './types'

export * from './types'

/** Every tool the copilot can call, grouped by domain in their own files. */
export const copilotTools: CopilotTool[] = [...orderTools, ...productTools, ...stripeTools]

/** Name → tool lookup for fast dispatch during the tool-calling loop. */
const toolByName = new Map<string, CopilotTool>(
  copilotTools.map((tool) => [tool.definition.function.name, tool]),
)

/** The OpenAI `tools` array advertised to the model. */
export const toolDefinitions: ToolDefinition[] = copilotTools.map((tool) => tool.definition)

/**
 * Run a tool the model asked for. Unknown names and handler errors are returned
 * as a stringified `{ error }` so the model can recover instead of the whole
 * request failing.
 */
export async function runTool(name: string, args: unknown, ctx: ToolContext): Promise<string> {
  const tool = toolByName.get(name)
  if (!tool) return JSON.stringify({ error: `Unknown tool: ${name}` })

  try {
    const result = await tool.handler(args ?? {}, ctx)
    return JSON.stringify(result ?? null)
  } catch (error: any) {
    return JSON.stringify({ error: error?.message ?? 'Tool execution failed' })
  }
}
