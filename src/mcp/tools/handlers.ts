import {
  getMobileWithCountryCode,
  prepareErrorMessageForAgents,
  removeZeroValues,
} from '../../utils'

import { SocialService } from '../../service/social.service'
import { UserProfile } from '../../typings'
import { validateToolInput } from './joiSchema'
import { LoggerProvider } from '../../provider'
const logger = LoggerProvider.Instance.logger

export async function handleToolCall(toolName: string, body: any, userProfile: UserProfile) {
  console.log(`[MCP-HANDLER] 🎯 Handler received tool call: ${toolName}`)
  logger.info('Handling tool call:', { toolName, body })
  try {
    const args = removeZeroValues(body) as any
    console.log(`[MCP-HANDLER] 📋 Validating input for: ${toolName}`)
    validateToolInput(toolName, args)
    console.log(`[MCP-HANDLER] ✅ Validation passed, executing: ${toolName}`)
    switch (toolName) {
      case 'sendWhatsappMessage': {
        const mobileWithCountryCode = getMobileWithCountryCode(args.mobileNumber)
        await SocialService.Instance.sendMessageToUser({
          message: args.message,
          socialId: mobileWithCountryCode,
          orgId: userProfile.orgId,
          userId: userProfile.userId,
          isTemplated: false,
          template: null,
          needToAskForLead: false,
        })
        return { message: 'Message sent successfully' }
      }

      case 'sendReplyBackMediaToUser': {
        await SocialService.Instance.replyMediaBackToUser({ keyId: args.keyId }, userProfile.orgId)
        return { message: 'Media reply sent successfully' }
      }

      case 'getWhatsAppHistory': {
        const mobileWithCountryCode = getMobileWithCountryCode(args.mobileNumber)
        return await SocialService.Instance.getWhatsAppHistoryBySocialId(mobileWithCountryCode, userProfile.orgId)
      }

      // ==================== User Tools (placeholders) ====================
      // Dummy stubs so the tools are exposed and validated now. Wire them to the
      // real UserService once the implementation is ready.
      case 'listUsers':
      case 'getUserDetails':
      case 'createUser':
        return { message: `Tool "${toolName}" is not implemented yet.`, data: null }

      default:
        return { message: `Unknown tool: ${toolName}` }
    }
  } catch (error: any) {
    logger.error(`Error in handleToolCall for tool ${toolName}:`, error)
    return {
      message: prepareErrorMessageForAgents(error),
    }
  }
}
