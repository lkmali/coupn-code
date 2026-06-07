import { UserProfile } from '../../../typings'

/**
 * Context handed to every tool handler. The copilot always runs on behalf of the
 * authenticated dashboard user, so handlers scope their reads to `user.orgId`
 * (and to `user.userId` for non-admins) exactly like the HTTP controllers do.
 */
export interface ToolContext {
  user: UserProfile
}

/** OpenAI `chat.completions` tool/function schema. */
export interface ToolDefinition {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: Record<string, unknown>
  }
}

/** A copilot tool = its OpenAI schema plus the server-side handler that runs it. */
export interface CopilotTool {
  definition: ToolDefinition
  handler: (args: any, ctx: ToolContext) => Promise<unknown>
}
