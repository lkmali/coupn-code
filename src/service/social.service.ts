import {
  ISocialContract,
  ISocialMessage,
  MessageDirection,
  ReplyInterface,
  SendToAgent,
  SocialMediaType,
  SocialMessageRequest,
  WebhookEventType,
  IMetaAttributes,
  IOrganizationConfiguration,
  MediaTypeEnum,
  PaginateDataType
} from '../typings'
import {
  isNil,
  parseWhatsAppWebhook,
  parseInstagramWebhook,
  unauthorized,
  formatAIMessage,
  getPaginateData,
  paginate,
  extractButtonLabels,
  resolveTemplateComponents
} from '../utils'
import { TimezoneUtil } from '../utils/timezone.util'
import {
    MongoS3TempKeyRepository,
  MongoSocialContactRepository,
  MongoSocialMessageRepository,
  toObjectId,
} from '../database'
import { UserProfile } from '../typings'
import { LoggerProvider } from '../provider/logger.provider'
import { WhatsAppChatService } from './meta/whatsAppChat'
import { AxiosService } from './axios.service'
import { isEmpty, pick } from 'lodash'
import { awsConfigurationKey } from '../config'
import { S3Service } from './aws'
import { MetaService } from './meta/metaServices'
import { OrganizationConfigurationService } from './organizationConfiguration.service'
import { MessageQuery, WhatsappMediaDto } from '../dto'
import { RedisService } from './redis.service'


const loggerProvider = LoggerProvider.Instance
export class SocialService {
  private static instance: SocialService
  private readonly axiosService = AxiosService.Instance
  private readonly s3Service: S3Service
  private readonly s3TempKeyRepository: MongoS3TempKeyRepository
  private readonly socialContactRepository: MongoSocialContactRepository
  private readonly socialMessageRepository: MongoSocialMessageRepository
  private readonly organizationConfigurationService: OrganizationConfigurationService
  private readonly redisService: RedisService
  private readonly CACHE_TTL = 3600 * 24 // 23 hour in seconds
  private readonly CACHE_KEY_PREFIX = 'whatsApp:'
  constructor() {
    this.axiosService = AxiosService.Instance
    this.s3Service = new S3Service()
    this.redisService = RedisService.Instance
    this.socialContactRepository = new MongoSocialContactRepository()
    this.socialMessageRepository = new MongoSocialMessageRepository()
    this.s3TempKeyRepository = new MongoS3TempKeyRepository()
    this.organizationConfigurationService = OrganizationConfigurationService.Instance
    // Enable queue if Redis is configured
  }

  /**
   * Process webhooks dynamically based on the webhook type
   * @param webhookBody - The webhook request body
   * @param orgId - Organization ID
   */
  async processWebhook(
    webhookBody: any,
    orgId: string,
    config: IOrganizationConfiguration,
    trackingId: string,
  ): Promise<void> {
    try {
      const webhookType = this.identifyWebhookType(webhookBody)
      loggerProvider.logger.info(`[${trackingId}] Processing webhook for orgId: ${orgId}`, { webhookType, trackingId })
      // Fetch organization configuration from database
      // Determine webhook type from the payload

      // Route to appropriate handler based on webhook type
      switch (webhookType) {
        case WebhookEventType.WHATSAPP_MESSAGE:
          await this.processWhatsAppMessageWebhook(webhookBody, orgId, config, trackingId)
          break
        case WebhookEventType.INSTAGRAM_MESSAGE:
          await this.processInstagramMessageWebhook(webhookBody, orgId, config, trackingId)
          break
        case WebhookEventType.FACEBOOK_LEADGEN:
          await this.processFacebookLeadGenWebhook(webhookBody, config)
          break
        default:
          loggerProvider.logger.error('Unknown webhook type:', { webhookBody })
          break
      }
    } catch (error: any) {
      loggerProvider.logger.error(`[${trackingId}] processWebhook_Error`, {
        error: error.message,
        stack: error.stack,
        orgId,
        trackingId,
      })
      // Don't throw - we don't want to fail the webhook
    }
  }

  /**
   * Identify webhook type based on the payload structure
   * @param webhookBody - The webhook request body
   * @returns WebhookEventType
   */
  private identifyWebhookType(webhookBody: any): WebhookEventType | null {
    // Check if this is a WhatsApp Business Account webhook
    if (
      webhookBody.object === 'whatsapp_business_account' ||
      webhookBody.entry?.[0]?.changes?.[0]?.field === 'messages'
    ) {
      return WebhookEventType.WHATSAPP_MESSAGE
    }

    // Check if this is an Instagram message webhook
    if (webhookBody.object === 'instagram' && webhookBody.entry?.[0]?.messaging) {
      return WebhookEventType.INSTAGRAM_MESSAGE
    }

    // Check if this is a Facebook Lead Generation webhook
    if (webhookBody.object === 'page' && webhookBody.entry?.[0]?.changes?.[0]?.field === 'leadgen') {
      return WebhookEventType.FACEBOOK_LEADGEN
    }

    return null
  }

  /**
   * Process WhatsApp message webhook
   * @param webhookBody - The webhook request body
   * @param orgId - Organization ID
   * @param metaConfig - Meta configuration from database
   */
  private async processWhatsAppMessageWebhook(
    webhookBody: any,
    _orgId: string,
    config: IOrganizationConfiguration,
    trackingId: string,
  ): Promise<void> {
    // Check if this is a status update webhook
    // if (statuses && statuses.length > 0) {
    //   this.processWhatsAppStatusWebhook(statuses, trackingId, orgId)
    //   return
    // }
    const result = parseWhatsAppWebhook(webhookBody)
    console.log('Parsed WhatsApp webhook result:', { config,result, trackingId })
  }



 

  /**
   * Process Instagram message webhook
   * @param webhookBody - The webhook request body
   * @param orgId - Organization ID
   * @param metaConfig - Meta configuration from database
   */
  private async processInstagramMessageWebhook(
    webhookBody: any,
    orgId: string,
    config: IOrganizationConfiguration,
    trackingId: string,
  ): Promise<void> {
    const result = parseInstagramWebhook(webhookBody)
    console.log('Parsed Instagram webhook result:', {orgId, config,result, trackingId })
  }

  /**
   * Generic method to process social media webhooks (WhatsApp, Instagram, Facebook)
   * @param result - Parsed webhook data
   * @param orgId - Organization ID
   * @param source - Source platform (WHATSAPP, INSTAGRAM, etc.)
   * @param methodName - Method name for logging
   * @param metaConfig - Meta configuration from database
   */

  
     
    

  async sendFinalResponse({
    message,
    socialId,
    orgId,
    mediaId,
    messageType,
    mediaUploadKey,
    trackingId,
    messageId,
    mobileNumber,
    source,
    metaConfig,
    phoneNumberId,
    welcomeMessage,
    isFirstMessage,
  }: ReplyInterface) {
    // This method is called from queue processor or directly (if queue disabled)

    try {
      loggerProvider.logger.info(`[${trackingId}] sendFinalResponse started`, {
        orgId,
        trackingId,
        socialId,
        messageType,
      })
      const agentsData: SendToAgent = {
        orgId,
        socialId,
        userId: socialId,
        messageType,
        mobileNumber,
        isMediaMessage: messageType !== 'text',
        isTextMessage: messageType === 'text',
        mediaUrl: '',
        message,
        metadata: '',
        timestamp: TimezoneUtil.nowUTC(),
        source,
        input: message,
        user_id: socialId,
        welcomeMessage,
        trackingId: trackingId,
        messageId,

        // Pass trackingId for AI timing tracking
      }

      // Use metaConfig from database or fallback to env
      const config = metaConfig

      // Validate media type
      if (messageType !== 'text' && config.supportMediaType.indexOf(messageType) < 0) {
        loggerProvider.logger.error(`[${trackingId}] Unsupported media type`, {
          socialId,
          source,
          messageType,
          trackingId,
        })
        await this.sendSocialMessage(
          {
            message: 'We are not supporting this type of media',
            socialId,
            orgId,
            messageId,
            source,
            trackingId,
            template: null,
            isTemplated: false,
            needToAskForLead: false,
          },
          config,
          [phoneNumberId]
        )
        return
      }

      // Download media if needed
      if (!isEmpty(mediaId) && config.supportMediaType.indexOf(messageType) >= 0) {
        loggerProvider.logger.info(`[${trackingId}] Downloading and uploading media to S3`, {
          trackingId,
          mediaId,
          messageType,
        })
        await this.downloadMediaAndUploadS3AndGetKey(mediaId, mediaUploadKey, source, config, trackingId)
        agentsData.mediaUrl = (await this.getImageDownloadSignInUrl(mediaUploadKey)) ?? ''
        if (messageType === 'audio') {
          const id = new Date().valueOf().toString()
          const replyBackKey = `${orgId}/${socialId}/${MessageDirection.OUTBOUND}/${id}.mp3`
          const { keyId } = await this.s3Service.getS3Key(replyBackKey, 'audio/mp3', orgId, {
            socialId,
            mediaType: MediaTypeEnum.audio,
            fileName: `${id}.mp3`,
          })
          agentsData['uploadMediaKey'] = replyBackKey
          agentsData['responseId'] = keyId
          agentsData['publicBucketName'] = awsConfigurationKey.s3Config.publicBucketName
          agentsData['publicBucketAccessId'] = awsConfigurationKey.s3Config.publicBucketAccessId
          agentsData['publicBucketSecretAccessKey'] = awsConfigurationKey.s3Config.publicBucketSecretAccessKey
          agentsData['bucketRegion'] = awsConfigurationKey.s3Config.publicBucketName
        }
      }

      if (isFirstMessage) {
        loggerProvider.logger.info(`[${trackingId}] first message received, continuing to AI agent`, { trackingId })
        return
      }

      // Send to AI and reply to user
      if (!isEmpty(agentsData.message) || !isEmpty(agentsData.mediaUrl)) {
        loggerProvider.logger.info(`[${trackingId}] Sending message to AI agent`, {
          trackingId,
          socialId,
          orgId,
          hasMedia: !isEmpty(agentsData.mediaUrl),
        })
        await this.replyToUser(agentsData, config, phoneNumberId)

        loggerProvider.logger.info(`[${trackingId}] Successfully completed processing`, {
          socialId,
          source,
          orgId,
          trackingId,
          messageType,
        })
      } else {
        loggerProvider.logger.error(`[${trackingId}] Message coming empty from user`, {
          socialId,
          source,
          orgId,
          trackingId,
          agentsData,
        })
      }
    } catch (error: any) {
      loggerProvider.logger.error(`[${trackingId}] sendFinalResponse_Error`, {
        error: error.message,
        stack: error.stack,
        socialId,
        source,
        orgId,
        trackingId,
      })
    }
  }

  async replyToUser(body: SendToAgent, metaConfig: IMetaAttributes,phoneNumberId:string) {
    const trackingId = body.trackingId
    try {
      loggerProvider.logger.info(`[${trackingId}] replyToUser started`, {
        trackingId,
        socialId: body.socialId,
        orgId: body.orgId,
      })
      let needToAskForLead = true
      let message = null
      let needToReplyUser = true
      let buttons = [] as string[]
      if (body.mobileNumber && body.mobileNumber.length >= 2) {
        needToAskForLead = false
        loggerProvider.logger.info(`[${trackingId}] Calling AI service`, { trackingId, socialId: body.socialId })
        const { message: aiMessage, buttons: b, needToReplyUser: need } = await this.sendMessageToAI(body, metaConfig)
        message = aiMessage
        buttons = b
        needToReplyUser = need
        loggerProvider.logger.info(`[${trackingId}] AI response received`, {
          trackingId,
          socialId: body.socialId,
          needToReplyUser,
        })
      }

      if (needToReplyUser && message) {
        await this.sendSocialMessage(
          {
            message,
            buttons,
            socialId: body.socialId,
            orgId: body.orgId,
            source: body.source,
            isTemplated: false,
            needToAskForLead,
            template: null,
            messageId: body.messageId,
            trackingId,
          },
          metaConfig,
        [phoneNumberId]
        )
      }

      try {
        if (body.welcomeMessage) {
          await this.sendSocialMessage(
            {
              message: '',
              socialId: body.socialId,
              orgId: body.orgId,

              mediaObject: {
                bucketKey: null,
                publicUrl: body.welcomeMessage.audioS3Url ?? '',
                type: MediaTypeEnum.audio,
              },
              isTemplated: false,
              template: null,
              needToAskForLead: false,
            },
            metaConfig,
            [phoneNumberId]
          )
        }
      } catch (error) {
        loggerProvider.logger.error(`[${trackingId}] replyToUser Error`, {
          socialId: body.socialId,
          orgId: body.orgId,
          trackingId,
        })
      }

      loggerProvider.logger.info(`[${trackingId}] Message sent to user successfully`, {
        socialId: body.socialId,
        source: body.source,
        orgId: body.orgId,
        trackingId,
        needToAskForLead,
      })
    } catch (error: any) {
      loggerProvider.logger.error(`[${trackingId}] replyToUser_Error`, {
        error: error.message,
        stack: error.stack,
        socialId: body.socialId,
        orgId: body.orgId,
        trackingId,
      })
      throw error
    }
  }

  async sendMessageToAI(
    body: SendToAgent,
    metaConfig: IMetaAttributes,
  ): Promise<{ message: string | null; buttons: string[]; needToReplyUser: boolean }> {
    const url = metaConfig.whatsappAgentsUrl
    const trackingId = body.trackingId

    if (!body.isTextMessage) {
      loggerProvider.logger.info(`[${trackingId}] Non-text message received, processing media`, {
        trackingId,
        socialId: body.socialId,
        messageType: body.messageType,
      })
    }
    try {
      loggerProvider.logger.info(`[${trackingId}] Sending request to AI agents`, {
        trackingId,
        socialId: body.socialId,
        url,
      })
      const AiResponse = await this.axiosService.post(url, body)
      const result = formatAIMessage(AiResponse)
      if (result.message.length > 1) {
        loggerProvider.logger.info(`[${trackingId}] AI response received successfully`, {
          trackingId,
          socialId: body.socialId,
          responseLength: result.message.length,
        })
        return { ...result, needToReplyUser: true }
      }

      loggerProvider.logger.error(`[${trackingId}] Empty response from AI`, { trackingId, result, url, body })

    

      if (!body.isTextMessage) {
        return {
          message: null,
          buttons: [],
          needToReplyUser: false,
        }
      }
      return {
        needToReplyUser: true,
        message: `Hello! Our sincere apologies for the technical glitch you encountered just now. \u{1F64F} We know this interrupted your flow.

Could you please try again? \u{2060}`,
        buttons: [],
      }
    } catch (error: any) {
      loggerProvider.logger.error(`[${trackingId}] Failed to get AI response`, 'sendMessageToAI', {
        source: body.source,
        message: body.message,
        url,
        body,
        messageType: body.messageType,
        socialId: body.socialId,
        error: error instanceof Error ? error.message : error,
        stack: error?.stack,
        trackingId,
      })

      return {
        message: `Hello! Our sincere apologies for the technical glitch you encountered just now. \u{1F64F} We know this interrupted your flow.

Could you please try again? \u{2060}`,
        buttons: [],
        needToReplyUser: true,
      }
    }
  }


  async saveAndGetSocialContact(
    body: Omit<ISocialContract, 'contactId' | 'isBlocked'>,
    trackingId: string,
    phoneNumberId:string,
    options = {},
  ): Promise<
    ISocialContract & {
      isNewMessage: boolean
      isFirstLanguage: boolean
      isLanguageSelectedByUser: boolean
    }
  > {
    try {
      const contractIdData = await this.socialContactRepository.getSocialContact(
        {
          socialId: body.socialId,
          orgId: toObjectId(body.orgId),
        },
        options,
      )

      if (contractIdData) {
        if (contractIdData.isBlocked) {
          return {
            ...contractIdData,
            isNewMessage: false,
            isFirstLanguage: false,
            isLanguageSelectedByUser: false,
          } as any
        }
        if (
          !(contractIdData.mobileNumber && contractIdData.mobileNumber.length <= 2) &&
          contractIdData.socialType !== (SocialMediaType.WHATSAPP as string)
        ) {
          contractIdData.mobileNumber = body.mobileNumber
        }

        contractIdData['phoneNumberId'] = body.phoneNumberId ?? contractIdData.phoneNumberId ?? phoneNumberId
        // Only persist language when the user actually selected one via WhatsApp button.
        // If contact already has a language, do not overwrite it on subsequent messages.
        const shouldWriteLanguage = !isNil(body.language) && isNil(contractIdData.language)
        await this.socialContactRepository.updateSocialContact(
          {
            _id: contractIdData.contactId,
          } as any,
          {
            ...pick(body, ['lastSeen', 'id']),
            ...(shouldWriteLanguage ? { language: body.language } : {}),
            ...(body.name && body.name.length > 2 ? { name: body.name } : {}),
            updatedAt: TimezoneUtil.nowUTC(),
            phoneNumberId:body.phoneNumberId ?? contractIdData.phoneNumberId ?? phoneNumberId,
          } as any,
          options,
        )
        const isLanguageSelectedByUser = !isNil(body.language) || !isNil(contractIdData.language)
        const isFirstLanguage = shouldWriteLanguage
        return {
          ...contractIdData,
          isNewMessage: false,
          isFirstLanguage,
          isLanguageSelectedByUser,
          language: shouldWriteLanguage ? body.language : contractIdData.language,
        } as any
      } else {
        let isFirstLanguage = !isNil(body.language)

        const result = await this.socialContactRepository.saveSocialContact(
          {
             ...body,
             phoneNumberId:body.phoneNumberId ?? phoneNumberId,
            isBlocked: false,
            updatedAt: TimezoneUtil.nowUTC(),
            createdAt: TimezoneUtil.nowUTC(),
          } as any,
          options,
        )

        return {
          isLanguageSelectedByUser: !isNil(body.language),
          ...result,
          isNewMessage: true,
          isFirstLanguage,
        } as any
      }
    } catch (error: any) {
      loggerProvider.logger.error(`${trackingId}_saveAndGetSocialContact_Error`, {
        error: error.message,
        stack: error.stack,
        socialId: body.socialId,
        orgId: body.orgId,
      })
      throw error
    }
  }


  public async sendSocialMessage(body: SocialMessageRequest, metaConfig: IMetaAttributes,phoneNumberIds:string[]) {
    const trackingId = body.trackingId ?? `replyBack_${body.orgId}_${Date.now()}`
    try { 
      if(phoneNumberIds.length === 0){
        loggerProvider.logger.error(`[${trackingId}] No phone numbers available to send message`, {
          orgId: body.orgId,
          socialId: body.socialId,
          trackingId,
        })
        return 
      }  
      const { contactId, socialType, phoneNumberId } = await this.saveAndGetSocialContact(
        {
          socialId: body.socialId,
          name: body.name ?? '',
          mobileNumber: SocialMediaType.WHATSAPP === body.source ? body.socialId : '',
          socialType: body.source ?? SocialMediaType.WHATSAPP,
          lastSeen: TimezoneUtil.nowUTC(),
          createdAt: TimezoneUtil.nowUTC(),
          orgId: body.orgId,
          updatedAt: TimezoneUtil.nowUTC()
        },
        trackingId,
        phoneNumberIds[0],
      )
      // Every templated send now goes through the unified dynamic flow.
      // For templates without stored `components`, build them on the fly from
      // legacy fields (bodyObject, buttons, headerImageUrl, imageUrl, documents).
      const resolvedComponents = body.isTemplated && body.template
        ? resolveTemplateComponents(body.template, body.bodyObject, body.buttons, body.headerImageUrl)
        : []
      // SocialMessage.buttons stays string[]: resolve labels from the components
      // we will actually send so the DB shape is stable.
      const persistedButtons = resolvedComponents.length > 0
        ? extractButtonLabels(resolvedComponents, body.templateVariables ?? {})
        : (body.buttons ?? [])
      const saveResult = {
        ...pick(body, ['orgId', 'userType', 'createdBy']),
        contactId,
        createdAt: TimezoneUtil.nowUTC(),
        updatedAt: TimezoneUtil.nowUTC(),
        body: body.message,
        ...(persistedButtons.length > 0 && {
          buttons: persistedButtons,
        }),
        direction: MessageDirection.OUTBOUND,
        socialType: body.source ?? SocialMediaType.WHATSAPP,
        type: body?.mediaObject?.type ?? 'text',
        ...(body?.mediaObject?.bucketKey && {
          ...{
            bucketKey: body?.mediaObject?.bucketKey,
          },
        }),
        ...(body?.mediaObject?.publicUrl && {
          ...{
            publicUrl: body?.mediaObject?.publicUrl,
          },
        }),
        ...(body?.mediaObject?.caption && { caption: body.mediaObject.caption }),
        ...(body?.mediaObject?.fileName && { filename: body.mediaObject.fileName }),
        ...(body?.mediaObject?.mimeType && { mimeType: body.mediaObject.mimeType }),
        trackingId,
        timestamp: TimezoneUtil.nowUTC(),
      } as ISocialMessage

      if (body?.testimonialMediaObject?.publicUrl) {
        saveResult.type = (body?.testimonialMediaObject?.type ?? MediaTypeEnum.video) as any
        saveResult.publicUrl = body?.testimonialMediaObject?.publicUrl
        saveResult.caption = body?.testimonialMediaObject?.body ?? ''
      }
      await this.isNeedToSendWelcomeMessage(body.socialId)
      const result = await this.socialMessageRepository.saveSocialMessage(saveResult as any)
      if (body.isTemplated && body.template) {
        await WhatsAppChatService.Instance.sendDynamicTemplateMessage({
          mobileNumber: body.socialId,
          metaConfig,
          template: body.template,
          components: resolvedComponents,
          variables: body.templateVariables ?? {},
          trackingId,
          phoneNumberId: phoneNumberId ?? phoneNumberIds[0],
          orgId: body.orgId,
          socialMessageId: result.id as any,
        })
        return
      }
      if (body?.mediaObject?.publicUrl) {
        await this.dispatchMediaMessage({
          mediaObject: body.mediaObject,
          mobileNumber: body.socialId,
          metaConfig,
          trackingId,
          orgId: body.orgId,
          phoneNumberId: phoneNumberId ?? phoneNumberIds[0],
          socialMessageId: result.id as any,
          replyToMessageId: body.messageId,
        })
        return
      }

      if (body?.testimonialMediaObject?.publicUrl) {
        await WhatsAppChatService.Instance.sendVideoToUser({
          mobileNumber: body.socialId,
          videoLinkUrl: body?.testimonialMediaObject.publicUrl,
          captionText: body?.testimonialMediaObject.body ?? '',
          metaConfig,
          trackingId,
             phoneNumberId:phoneNumberId??phoneNumberIds[0],
          orgId: body.orgId,
          socialMessageId: result.id as any,
        })
        return
      }
      if (body.message && body.message.length > 0) {
        await MetaService.Instance.sendButtonMessage(
          socialType,
          body.socialId,
          body.message,
          body?.buttons ?? [],
          metaConfig,
          trackingId,
          body.orgId,
          result.id as any,
          phoneNumberId??phoneNumberIds[0],
          body.messageId
        )
      }
    } catch (error: any) {
      loggerProvider.logger.error(`${body.trackingId}sendMessageToUser_Error`, {
        error: error.message,
        stack: error.stack,
        socialId: body.socialId,
      })
      throw error
    }
  }

  public async sendSocialMessageWithTransactions(
    body: SocialMessageRequest,
    metaConfig: IMetaAttributes,
    phoneNumberIds:string[],
    options: { session?: any } = {},
  ) {
    const trackingId = body.trackingId ?? `replyBack_${body.orgId}_${Date.now()}`
    try {
      const { contactId, socialType ,phoneNumberId} = await this.saveAndGetSocialContact(
        {
          socialId: body.socialId,
          name: body.name ?? '',
          mobileNumber: SocialMediaType.WHATSAPP === body.source ? body.socialId : '',
          socialType: body.source ?? SocialMediaType.WHATSAPP,
          lastSeen: TimezoneUtil.nowUTC(),
          createdAt: TimezoneUtil.nowUTC(),
          orgId: body.orgId,
          updatedAt: TimezoneUtil.nowUTC(),
        },
        trackingId,
        phoneNumberIds[0],
        options,
      )
      // Every templated send now goes through the unified dynamic flow.
      // For templates without stored `components`, build them on the fly from
      // legacy fields (bodyObject, buttons, headerImageUrl, imageUrl, documents).
      const resolvedComponents = body.isTemplated && body.template
        ? resolveTemplateComponents(body.template, body.bodyObject, body.buttons, body.headerImageUrl)
        : []
      // SocialMessage.buttons stays string[]: resolve labels from the components
      // we will actually send so the DB shape is stable.
      const persistedButtons = resolvedComponents.length > 0
        ? extractButtonLabels(resolvedComponents, body.templateVariables ?? {})
        : (body.buttons ?? [])
      const saveResult = {
        ...pick(body, ['orgId', 'userType', 'createdBy']),
        contactId,
        createdAt: TimezoneUtil.nowUTC(),
        updatedAt: TimezoneUtil.nowUTC(),
        body: body.message,
        ...(persistedButtons.length > 0 && {
          buttons: persistedButtons,
        }),
        direction: MessageDirection.OUTBOUND,
        socialType: body.source ?? SocialMediaType.WHATSAPP,
        type: body?.mediaObject?.type ?? 'text',
        ...(body?.mediaObject?.bucketKey && {
          ...{
            bucketKey: body?.mediaObject?.bucketKey,
          },
        }),
        ...(body?.mediaObject?.publicUrl && {
          ...{
            publicUrl: body?.mediaObject?.publicUrl,
          },
        }),
        ...(body?.mediaObject?.caption && { caption: body.mediaObject.caption }),
        ...(body?.mediaObject?.fileName && { filename: body.mediaObject.fileName }),
        ...(body?.mediaObject?.mimeType && { mimeType: body.mediaObject.mimeType }),
        trackingId,
        timestamp: TimezoneUtil.nowUTC(),
      } as ISocialMessage

      if (body?.testimonialMediaObject?.publicUrl) {
        saveResult.type = (body?.testimonialMediaObject?.type ?? MediaTypeEnum.video) as any
        saveResult.publicUrl = body?.testimonialMediaObject?.publicUrl
        saveResult.caption = body?.testimonialMediaObject?.body ?? ''
      }
      await this.isNeedToSendWelcomeMessage(body.socialId)
      const result = await this.socialMessageRepository.saveSocialMessage(saveResult as any, options)
      if (body.isTemplated && body.template) {
        await WhatsAppChatService.Instance.sendDynamicTemplateMessage({
          mobileNumber: body.socialId,
          metaConfig,
          template: body.template,
          components: resolvedComponents,
          variables: body.templateVariables ?? {},
          trackingId,
          phoneNumberId: phoneNumberId ?? phoneNumberIds[0],
          orgId: body.orgId,
          socialMessageId: result.id as any,
        })
        return
      }
      if (body?.mediaObject?.publicUrl) {
        await this.dispatchMediaMessage({
          mediaObject: body.mediaObject,
          mobileNumber: body.socialId,
          metaConfig,
          trackingId,
          orgId: body.orgId,
          phoneNumberId: phoneNumberId ?? phoneNumberIds[0],
          socialMessageId: result.id as any,
          replyToMessageId: body.messageId,
        })
        return
      }

      if (body?.testimonialMediaObject?.publicUrl) {
        await WhatsAppChatService.Instance.sendVideoToUser({
          mobileNumber: body.socialId,
          videoLinkUrl: body?.testimonialMediaObject.publicUrl,
          captionText: body?.testimonialMediaObject.body ?? '',
          metaConfig,
            phoneNumberId: phoneNumberId ?? phoneNumberIds[0],
          trackingId,
          orgId: body.orgId,
          socialMessageId: result.id as any,
        })
        return
      }
      if (body.message && body.message.length > 0) {
        await MetaService.Instance.sendButtonMessage(
          socialType,
          body.socialId,
          body.message,
          body?.buttons ?? [],
          metaConfig,
          trackingId,
          body.orgId,
          result.id as any,
        phoneNumberId??phoneNumberIds[0],
          body.messageId,
        )
      }
    } catch (error: any) {
      loggerProvider.logger.error(`${body.trackingId}sendMessageToUser_Error`, {
        error: error.message,
        stack: error.stack,
        socialId: body.socialId,
      })
      throw error
    }
  }

  public async sendMessageToUser(body: SocialMessageRequest) {
    try {
      const result = await this.getContract(body.socialId, body.orgId)

      if (!result) {
        body.source = SocialMediaType.WHATSAPP
        body.name = ''
      } else {
        body.source = result.socialType as SocialMediaType
        body.name = result.name
      }

      const orgConfig = await this.organizationConfigurationService.getOrganizationConfiguration(body.orgId)

      // Use configuration from database or fallback to environment variables
      const metaConfig: IMetaAttributes = orgConfig.metaAttributes
      await this.sendSocialMessage(body, metaConfig,orgConfig.phoneNumbersId)
    } catch (error: any) {
      loggerProvider.logger.error('sendMessageToUser_Error', {
        error: error.message,
        stack: error.stack,
        socialId: body.socialId,
        orgId: body.orgId,
      })
      throw error
    }
  }

  // Send a free-form plain-text WhatsApp message. Only delivers inside the 24h customer-service
  // window (i.e. when the recipient has messaged recently), so it is used for confirmation replies to
  // an inbound action — not for proactive notifications (those go via approved templates).
  public async sendPlainTextMessage(mobileNumber: string, message: string, orgId: string): Promise<void> {
    await this.sendMessageToUser({
      message,
      socialId: mobileNumber,
      orgId,
      isTemplated: false,
      needToAskForLead: false,
      template: null,
      source: SocialMediaType.WHATSAPP,
    } as SocialMessageRequest)
  }






    public async replyMediaBackToUserFromAgents(body: WhatsappMediaDto, orgId: string) {
    try {
      const result = await this.s3TempKeyRepository.getS3TempKey({
        _id: toObjectId(body.keyId),
        orgId: toObjectId(orgId),
        isDelete: false,
      } as any)
      if (!result || !result?.metaData?.socialId) {
        unauthorized('invalid Id')
      }
      const orgConfig = await this.organizationConfigurationService.getOrganizationConfiguration(orgId)
      await this.s3Service.moveObject(result!.s3Key, result!.s3Key)
      const publicUrl = await this.s3Service.getPublicDownloadSignedUrl(result!.s3Key)
      const metaConfig: IMetaAttributes = orgConfig.metaAttributes
      await this.sendSocialMessage(
        {
          message: '',
          socialId: result!.metaData?.socialId ?? '',
          template: null,
          orgId,
          mediaObject: {
            bucketKey: result!.s3Key,
            publicUrl,
            type: result!.metaData!.mediaType ?? MediaTypeEnum.audio,
          },
          isTemplated: false,
          needToAskForLead: false,
        },
        metaConfig,
        orgConfig.phoneNumbersId,

      )
      await this.s3TempKeyRepository.removeS3TempKey({
        _id: toObjectId(result!.id),
      } as any)
    } catch (error: any) {
      loggerProvider.logger.error('replyMediaBackToUser_Error', {
        error: error.message,
        stack: error.stack,
      })
      throw error
    }
  }

  public async replyMediaBackToUser(
    body: WhatsappMediaDto & { mobileNumber?: string; caption?: string; userId?: any },
    orgId: string,
  ) {
    try {
      const result = await this.s3TempKeyRepository.getS3TempKey({
        _id: toObjectId(body.keyId),
        orgId: toObjectId(orgId),
        isDelete: false,
      } as any)
      if (!result) {
        unauthorized('invalid Id')
      }
      // For agent-driven flows the temp-key must already carry the socialId
      // (the user we're replying to). For staff-initiated flows the recipient
      // is supplied via the request body so we don't need it on metaData.
      const recipient = body.mobileNumber || result!.metaData?.socialId
      if (!recipient) {
        unauthorized('invalid Id')
      }
      const orgConfig = await this.organizationConfigurationService.getOrganizationConfiguration(orgId)
      // The presigned PUT signed by getPublicUploadSignedUrlAndCreateTempBucket
      // already targets the private bucket (s3Config.bucketName), which is the
      // same bucket getPublicDownloadSignedUrl reads from — no copy needed.
      const publicUrl = await this.s3Service.getPublicDownloadSignedUrl(result!.s3Key)
      const metaConfig: IMetaAttributes = orgConfig.metaAttributes
      await this.sendSocialMessage(
        {
          message: '',
          socialId: recipient!,
          template: null,
          orgId,
          ...(body.userId ? { userId: body.userId } : {}),
          mediaObject: {
            bucketKey: result!.s3Key,
            publicUrl,
            type: result!.metaData!.mediaType ?? MediaTypeEnum.audio,
            ...(body.caption ? { caption: body.caption } : {}),
            ...(result!.metaData?.fileName ? { fileName: result!.metaData.fileName } : {}),
            ...(result!.metaData?.fileType ? { mimeType: result!.metaData.fileType } : {}),
          },
          isTemplated: false,
          needToAskForLead: false,
        },
        metaConfig,
        orgConfig.phoneNumbersId,

      )
      await this.s3TempKeyRepository.removeS3TempKey({
        _id: toObjectId(result!.id),
      } as any)
    } catch (error: any) {
      loggerProvider.logger.error('replyMediaBackToUser_Error', {
        error: error.message,
        stack: error.stack,
      })
      throw error
    }
  }

  /**
   * Dispatch a media message via the WhatsApp Cloud API based on the media
   * type stored on the SocialMessage. Documents/images/videos use their own
   * payload shape; anything else falls back to audio (matches legacy behavior).
   */
  private async dispatchMediaMessage(params: {
    mediaObject: NonNullable<SocialMessageRequest['mediaObject']>
    mobileNumber: string
    metaConfig: IMetaAttributes
    trackingId: string
    orgId: string
    phoneNumberId: string
    socialMessageId: string
    replyToMessageId?: string | null
  }) {
    const { mediaObject, mobileNumber, metaConfig, trackingId, orgId, phoneNumberId, socialMessageId, replyToMessageId } = params
    const baseParams = { mobileNumber, metaConfig, trackingId, orgId, phoneNumberId, socialMessageId }
    switch (mediaObject.type) {
      case MediaTypeEnum.image:
        await WhatsAppChatService.Instance.sendImageToUser({
          ...baseParams,
          imageUrl: mediaObject.publicUrl,
          caption: mediaObject.caption,
        })
        return
      case MediaTypeEnum.video:
        await WhatsAppChatService.Instance.sendVideoToUser({
          ...baseParams,
          videoLinkUrl: mediaObject.publicUrl,
          captionText: mediaObject.caption ?? '',
        })
        return
      case MediaTypeEnum.document:
        await WhatsAppChatService.Instance.sendDocumentToUser({
          ...baseParams,
          documentUrl: mediaObject.publicUrl,
          fileName: mediaObject.fileName,
          caption: mediaObject.caption,
        })
        return
      case MediaTypeEnum.audio:
      default:
        await WhatsAppChatService.Instance.sendAudioMessageToUserWithUrl({
          ...baseParams,
          publicUrl: mediaObject.publicUrl,
          replyToMessageId: replyToMessageId ?? null,
        })
        return
    }
  }

  async downloadMediaAndUploadS3AndGetKey(
    mediaId: string,
    key: string,
    socialMediaType: SocialMediaType,
    metaConfig: IMetaAttributes,
    trackingId: string,
  ) {
    try {
      const { data, mime_type } = await MetaService.Instance.downloadMedia(
        socialMediaType,
        mediaId,
        metaConfig,
        trackingId,
      )
      await this.s3Service.streamWhatsAppMediaToS3(data, mime_type, key)
    } catch (error: any) {
      loggerProvider.logger.error(`${trackingId}downloadMediaAndUploadS3AndGetKey_Error`, {
        error: error.message,
        stack: error.stack,
        mediaId,
        key,
        socialMediaType,
      })
      throw error
    }
  }

  async getImageDownloadSignInUrl(key: string): Promise<string> {
    try {
      return await this.s3Service.getImageDownloadSignInUrl(key)
    } catch (error: any) {
      loggerProvider.logger.error('getImageDownloadSignInUrl_Error', { error: error.message, stack: error.stack, key })
      return ''
    }
  }

  async getAllMessage(
    contactId: string,
    user: UserProfile,
    queryParams: MessageQuery,
  ): Promise<PaginateDataType<ISocialMessage>> {
    try {
      const filter = {
        ...paginate({
          orderBy: 'DESC',
          sortBy: 'timestamp',
          ...queryParams,
        }),
      }
      const count = await this.socialMessageRepository.countDocuments({
        contactId: toObjectId(contactId),
        orgId: toObjectId(user.orgId),
      })
      if (count <= 0) {
        return getPaginateData<ISocialMessage>(0, queryParams.pageNumber, [])
      }
      const result = await this.socialMessageRepository.getSocialMessages(
        { contactId: toObjectId(contactId), orgId: toObjectId(user.orgId) },
        filter,
      )
      const messagesWithUrls = await Promise.all(
        result.map(async (value: any) => {
          if (value.bucketKey && ['audio', 'image', 'document'].includes(value.type)) {
            try {
              if (!value.bucketKey) {
                return { ...value, publicUrl: value.publicUrl }
              }
              const publicUrl = await this.s3Service.getPublicDownloadSignedUrl(value.bucketKey)
              return { ...value, publicUrl }
            } catch (error) {
              loggerProvider.logger.error('Failed to get signed URL for bucket key:', {
                bucketKey: value.bucketKey,
                error,
              })
              return value
            }
          }
          return value
        }),
      )

      return getPaginateData<ISocialMessage>(count, queryParams.pageNumber, messagesWithUrls)
    } catch (error: any) {
      loggerProvider.logger.error('getAllMessage_Error', {
        error: error.message,
        stack: error.stack,
      })
      throw error
    }
  }

  async isNeedToSendWelcomeMessage(mobileNumber: string): Promise<boolean> {
    try {
      const key = `${this.CACHE_KEY_PREFIX}-${mobileNumber}`
      const result = await this.redisService.get(key)
      return !result
    } catch (error: any) {
      return false
    }
  }

  public async getContract(socialId: string, orgId: string) {
    try {
      return await this.socialContactRepository.getSocialContact({
        socialId,
        orgId: toObjectId(orgId),
      })
    } catch (error: any) {
      loggerProvider.logger.error('getContract_Error', { error: error.message, stack: error.stack, socialId, orgId })
      throw error
    }
  }

  /**
   * Parse Facebook lead field data to extract lead information
   * @param fieldData - Array of field objects from Facebook lead data
   * @returns Object containing email, fullName, and phoneNumber
   */
  public parseFacebookLeadFieldData(fieldData: Array<{ name: string; values?: string[] }>): {
    email: string
    fullName: string
    phoneNumber: string
  } {
    try {
      let email = ''
      let fullName = ''
      let phoneNumber = ''

      for (const field of fieldData) {
        if (field.name === 'email' && field.values && field.values.length > 0) {
          email = field.values[0]
        } else if (field.name === 'full_name' && field.values && field.values.length > 0) {
          fullName = field.values[0]
        } else if (field.name === 'phone_number' && field.values && field.values.length > 0) {
          phoneNumber = field.values[0]
        }
      }

      return { email, fullName, phoneNumber }
    } catch (error: any) {
      loggerProvider.logger.error('parseFacebookLeadFieldData_Error', { error: error.message, stack: error.stack })
      throw error
    }
  }

  /**
   * Process Facebook Lead Generation webhook
   * @param webhookBody - The webhook request body from Facebook
   * @param orgId - Organization ID
   * @param metaConfig - Meta configuration from database
   */
  public async processFacebookLeadGenWebhook(webhookBody: any, config: IOrganizationConfiguration): Promise<void> {
    try {
      loggerProvider.logger.info(`processFacebookLeadGenWebhook orgId: `, webhookBody)    
    } catch (error: any) {
      loggerProvider.logger.error('processFacebookLeadGenWebhook_Error', {
        error: error.message,
        stack: error.stack,
        orgId: config.orgId,
      })
      // Don't throw - we don't want to fail the webhook
    }
  }

  /**
   * Get WhatsApp message history for the last 3 months based on social ID
   * @param socialId - The WhatsApp social ID (phone number with country code)
   * @param orgId - Organization ID
   * @returns Promise<ISocialMessage[]> - Array of messages
   */
  async getWhatsAppHistoryBySocialId(socialId: string, orgId: string): Promise<ISocialMessage[]> {
    try {
      // Find the contact by socialId
      const contact = await this.socialContactRepository.getSocialContact({
        socialId,
        orgId: toObjectId(orgId),
        socialType: SocialMediaType.WHATSAPP,
      } as any)

      if (!contact) {
        loggerProvider.logger.warn(`No contact found for socialId: ${socialId}`)
        return []
      }

      // Calculate date 3 months ago
      const endDate = TimezoneUtil.nowUTC()
      const startDate = TimezoneUtil.nowUTC()
      startDate.setMonth(startDate.getMonth() - 3)

      // Get messages from the last 3 months
      const messages = await this.socialMessageRepository.getSocialMessages({
        contactId: contact.contactId,
        orgId: toObjectId(orgId),
        timestamp: { $gte: startDate, $lte: endDate },
      } as any)

      return messages as any
    } catch (error: any) {
      loggerProvider.logger.error('getWhatsAppHistoryBySocialId_Error', {
        error: error.message,
        stack: error.stack,
        socialId,
        orgId,
      })
      throw error
    }
  }

  async setCaseDataForUser(mobileNumber: string, updateTime: string) {
    try {
      const key = `${this.CACHE_KEY_PREFIX}-${mobileNumber}`

      await this.redisService.del(key)
      await this.redisService.set(key, updateTime, this.CACHE_TTL)
    } catch (error) {
      loggerProvider.logger.error('getInstance_Error', error)
    }
  }

  public static get Instance() {
    try {
      if (isNil(this.instance)) this.instance = new this()

      return this.instance
    } catch (error: any) {
      loggerProvider.logger.error('getInstance_Error', { error: error.message, stack: error.stack })
      throw error
    }
  }
}
