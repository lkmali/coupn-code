import { JsonController, Post, Body } from 'routing-controllers'
import { OpenAPI } from 'routing-controllers-openapi'
import { CopilotService } from '../service'
import { CurrentUser } from '../decorators'
import { UserProfile } from '../typings'
import { ChatRequestDto } from '../dto'

/**
 * Dashboard copilot. A single chat endpoint that runs an OpenAI tool-calling
 * loop over the user's running transcript. The model can only call read-only,
 * org-scoped tools (orders, products, Stripe), so the assistant never sees data
 * outside the authenticated user's organization. Requires JWT authentication.
 */
@JsonController('/copilot')
export class CopilotController {
  private copilotService = CopilotService.Instance

  @Post('/chat')
  @OpenAPI({
    summary: 'Chat with the dashboard copilot',
    tags: ['Copilot'],
    description:
      'Sends the running conversation transcript and returns the assistant reply. ' +
      'The server appends a system prompt and resolves any tool calls against the ' +
      "current user's orders, products and Stripe data before replying.",
    responses: {
      '200': {
        description: 'Assistant reply',
        content: {
          'application/json': {
            example: {
              success: true,
              data: { reply: 'You have 3 PAID orders this week.', toolsUsed: ['list_orders'] },
            },
          },
        },
      },
    },
  })
  async chat(@Body() body: ChatRequestDto, @CurrentUser() user: UserProfile) {
    const data = await this.copilotService.chat(user, body.messages)
    return { success: true, data }
  }
}
