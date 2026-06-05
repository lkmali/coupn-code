import { LoggerProvider } from '../../provider'
import { AxiosService } from '../axios.service'
import { isNil } from 'lodash'
import {
  ISendTextMessageParams,
  ISendMessageToReplyParams,
  ISendVideoParams,
  ISendTypingIndicatorParams,
  ISendButtonMessageParams,
  IUploadAudioMessageParams,
  IDownloadWhatsappMediaParams,
  ISendAudioMessageParams,
  ISendAppointmentStatusTemplateParams,
  ISendAddressTemplateParams,
  ISendAudioMessageWithUrlParams,
  ISendImageParams,
  ISendDocumentParams,
  ISendWhatsAppTemplateMessageParams,
  ISendDynamicTemplateParams,
} from '../../typings'
import { Messages } from '../../constants'
import { WhatsappApiResponseService } from '../whatsappApiResponse.service'
import { renderTemplateComponentsDetailed } from '../../utils/whatsAppTemplate'

const loggerProvider = LoggerProvider.Instance
export class WhatsAppChatService {
  private static instance: WhatsAppChatService
  private readonly axiosService = AxiosService.Instance
  private readonly whatsappApiResponseService = WhatsappApiResponseService.Instance

  constructor() {
    this.axiosService = AxiosService.Instance
  }

  /**
   * Save successful API response with messageId (SocialMessage.id)
   */
  private saveApiResponse(
    orgId: string,
    trackingId: string,
    eventName: string,
    body: any,
    response: any,
    socialMessageId: string,
    mobileNumber: string,
  ): void {
    this.whatsappApiResponseService.saveSuccessResponse({
      messageId: socialMessageId,
      orgId,
      trackingId,
      eventName,
      body,
      response,
      mobileNumber,
    })
  }

  /**
   * Save error API response without messageId (only trackingId)
   * Used when transaction is rolled back and messageId doesn't exist
   */
  private saveErrorResponse(
    orgId: string,
    trackingId: string,
    eventName: string,
    body: any,
    error: any,
    socialMessageId: string,
    mobileNumber: string,
  ): void {
    this.whatsappApiResponseService.saveErrorResponse({
      orgId,
      trackingId,
      eventName,
      body,
      error,
      messageId: socialMessageId,
      mobileNumber,
    })
  }

  async sendTextMessageToUser(params: ISendTextMessageParams) {
    const { mobileNumber, messages, metaConfig, trackingId, replyToMessageId, orgId, socialMessageId } = params
    loggerProvider.logger.info(`${trackingId} sendTextMessageToUser started`, { mobileNumber, replyToMessageId })
    const config = metaConfig
    const url = `${config.baseUrl}/${config.version}/${params.phoneNumberId}/messages`
    const data = {
      messaging_product: 'whatsapp',
      to: mobileNumber,
      type: 'text',
      text: { body: messages },
    } as any

    if (replyToMessageId) {
      data.context = {
        message_id: replyToMessageId,
      }
    }
    try {
      loggerProvider.logger.info(`${trackingId} Sending text message to user`, { mobileNumber, replyToMessageId })
      const result = await this.axiosService.post(url, data, {
        headers: {
          Authorization: `Bearer ${config.whatsapp.token}`,
          'Content-Type': 'application/json',
        },
      })
      loggerProvider.logger.info(`${trackingId} sendTextMessageToUser completed successfully`, { mobileNumber })
      if (orgId && socialMessageId) {
        this.saveApiResponse(orgId, trackingId, 'sendTextMessageToUser', data, result, socialMessageId, mobileNumber)
      }
      return result
    } catch (error: any) {
      if (orgId) {
        this.saveErrorResponse(orgId, trackingId, 'sendTextMessageToUser', data, error, socialMessageId, mobileNumber)
      }
      this.printError(error, `${trackingId} Failed to send text message`)
    }
  }

  async sendMessageToReply(params: ISendMessageToReplyParams) {
    const { mobileNumber, messages, metaConfig, trackingId, orgId, socialMessageId } = params
    loggerProvider.logger.info(`${trackingId} sendMessageToReply started`, { mobileNumber })
    const config = metaConfig
    const url = `${config.baseUrl}/${config.version}/${params.phoneNumberId}/messages`
    const data = {
      messaging_product: 'whatsapp',
      to: mobileNumber,
      type: 'text',
      text: { body: messages },
    }
    try {
      loggerProvider.logger.info(`${trackingId} Sending reply message to user`, { mobileNumber })
      const result = await this.axiosService.post(url, data, {
        headers: {
          Authorization: `Bearer ${config.whatsapp.token}`,
          'Content-Type': 'application/json',
        },
      })
      loggerProvider.logger.info(`${trackingId} sendMessageToReply completed successfully`, { mobileNumber })
      if (orgId && socialMessageId) {
        this.saveApiResponse(orgId, trackingId, 'sendMessageToReply', data, result, socialMessageId, mobileNumber)
      }
      return result
    } catch (error: any) {
      if (orgId) {
        this.saveErrorResponse(orgId, trackingId, 'sendMessageToReply', data, error, socialMessageId, mobileNumber)
      }
      this.printError(error, `${trackingId} Failed to send reply message`)
    }
  }

  async sendVideoToUser(params: ISendVideoParams) {
    const { mobileNumber, videoLinkUrl, captionText, metaConfig, trackingId, orgId, socialMessageId } = params
    loggerProvider.logger.info(`${trackingId} sendVideoToUser started`, { mobileNumber, videoLinkUrl })
    const config = metaConfig
    const url = `${config.baseUrl}/${config.version}/${params.phoneNumberId}/messages`
    const payload = {
      messaging_product: 'whatsapp',
      to: mobileNumber,
      type: 'video',
      video: {
        link: videoLinkUrl,
        caption: captionText,
      },
    }
    try {
      loggerProvider.logger.info(`${trackingId} Sending video message to user`, { mobileNumber, videoLinkUrl })
      const result = await this.axiosService.post(url, payload, {
        headers: {
          Authorization: `Bearer ${config.whatsapp.token}`,
          'Content-Type': 'application/json',
        },
      })
      loggerProvider.logger.info(`${trackingId} sendVideoToUser completed successfully`, { mobileNumber })
      if (orgId && socialMessageId) {
        this.saveApiResponse(orgId, trackingId, 'sendVideoToUser', payload, result, socialMessageId, mobileNumber)
      }
      return result
    } catch (error: any) {
      if (orgId) {
        this.saveErrorResponse(orgId, trackingId, 'sendVideoToUser', payload, error, socialMessageId, mobileNumber)
      }
      this.printError(error, `${trackingId} Failed to send video message`)
    }
  }

  async sendImageToUser(params: ISendImageParams) {
    const { mobileNumber, imageUrl, caption, metaConfig, trackingId, orgId, socialMessageId } = params
    loggerProvider.logger.info(`${trackingId} sendImageToUser started`, { mobileNumber, imageUrl })
    const config = metaConfig
    const url = `${config.baseUrl}/${config.version}/${params.phoneNumberId}/messages`
    const payload: any = {
      messaging_product: 'whatsapp',
      to: mobileNumber,
      type: 'image',
      image: {
        link: imageUrl,
      },
    }
    if (caption) {
      payload.image.caption = caption
    }
    try {
      loggerProvider.logger.info(`${trackingId} Sending image message to user`, { mobileNumber, imageUrl })
      const result = await this.axiosService.post(url, payload, {
        headers: {
          Authorization: `Bearer ${config.whatsapp.token}`,
          'Content-Type': 'application/json',
        },
      })
      loggerProvider.logger.info(`${trackingId} sendImageToUser completed successfully`, { mobileNumber })
      if (orgId && socialMessageId) {
        this.saveApiResponse(orgId, trackingId, 'sendImageToUser', payload, result, socialMessageId, mobileNumber)
      }
      return result
    } catch (error: any) {
      if (orgId && socialMessageId) {
        this.saveErrorResponse(orgId, trackingId, 'sendImageToUser', payload, error, socialMessageId, mobileNumber)
      }
      this.printError(error, `${trackingId} Failed to send image message`)
    }
  }

  async sendDocumentToUser(params: ISendDocumentParams) {
    const { mobileNumber, documentUrl, fileName, caption, metaConfig, trackingId, orgId, socialMessageId } = params
    loggerProvider.logger.info(`${trackingId} sendDocumentToUser started`, { mobileNumber, documentUrl, fileName })
    const config = metaConfig
    const url = `${config.baseUrl}/${config.version}/${params.phoneNumberId}/messages`
    const documentPayload: { link: string; filename?: string; caption?: string } = {
      link: documentUrl,
    }
    if (fileName) documentPayload.filename = fileName
    if (caption) documentPayload.caption = caption
    const payload = {
      messaging_product: 'whatsapp',
      to: mobileNumber,
      type: 'document',
      document: documentPayload,
    }
    try {
      loggerProvider.logger.info(`${trackingId} Sending document message to user`, { mobileNumber, documentUrl })
      const result = await this.axiosService.post(url, payload, {
        headers: {
          Authorization: `Bearer ${config.whatsapp.token}`,
          'Content-Type': 'application/json',
        },
      })
      loggerProvider.logger.info(`${trackingId} sendDocumentToUser completed successfully`, { mobileNumber })
      if (orgId && socialMessageId) {
        this.saveApiResponse(orgId, trackingId, 'sendDocumentToUser', payload, result, socialMessageId, mobileNumber)
      }
      return result
    } catch (error: any) {
      if (orgId && socialMessageId) {
        this.saveErrorResponse(orgId, trackingId, 'sendDocumentToUser', payload, error, socialMessageId, mobileNumber)
      }
      this.printError(error, `${trackingId} Failed to send document message`)
    }
  }

  async sendTypingIndicator(params: Omit<ISendTypingIndicatorParams, 'orgId' | 'socialMessageId'>) {
    const { whatsappMessageId, metaConfig, trackingId } = params
    loggerProvider.logger.info(`${trackingId} sendTypingIndicator started`, { whatsappMessageId })
    const config = metaConfig
    const url = `${config.baseUrl}/${config.version}/${params.phoneNumberId}/messages`
    const data = {
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: whatsappMessageId,
      typing_indicator: {
        type: 'text',
      },
    }
    try {
      loggerProvider.logger.info(`${trackingId} Sending typing indicator`, { whatsappMessageId })
      const result = await this.axiosService.post(url, data, {
        headers: {
          Authorization: `Bearer ${config.whatsapp.token}`,
          'Content-Type': 'application/json',
        },
      })
      loggerProvider.logger.info(`${trackingId} sendTypingIndicator completed successfully`, { whatsappMessageId })
      return result
    } catch (error: any) {
      this.printErrorWithoutThrowError(error, `${trackingId} Failed to send typing indicator`)
    }
  }

  async sendButtonMessageToUser(params: ISendButtonMessageParams) {
    const { mobileNumber, messages, buttons, metaConfig, trackingId, replyToMessageId, orgId, socialMessageId, phoneNumberId } = params
    loggerProvider.logger.info(`${trackingId} sendButtonMessageToUser started`, {
      mobileNumber,
      buttonsCount: buttons.length,
    })
    if (buttons.length <= 0) {
      return this.sendTextMessageToUser({
        mobileNumber,
        messages,
        metaConfig,
        trackingId,
        replyToMessageId,
        orgId,
        phoneNumberId,
        socialMessageId,
      })
    }
    const config = metaConfig
    const url = `${config.baseUrl}/${config.version}/${params.phoneNumberId}/messages`
    const data = {
      messaging_product: 'whatsapp',
      to: mobileNumber,
      type: 'interactive',
      interactive: {
        type: 'button',
        body: {
          text: messages,
        },
        action: {
          buttons: buttons.slice(0, 3).map((btnText, index) => ({
            type: 'reply',
            reply: {
              id: `button_${index + 1}`,
              title: btnText,
            },
          })),
        },
      },
    } as any

    if (replyToMessageId) {
      data.context = {
        message_id: replyToMessageId,
      }
    }
    try {
      loggerProvider.logger.info(`${trackingId} Sending button message to user`, {
        mobileNumber,
        buttonsCount: buttons.length,
      })
      const result = await this.axiosService.post(url, data, {
        headers: {
          Authorization: `Bearer ${config.whatsapp.token}`,
          'Content-Type': 'application/json',
        },
      })
      loggerProvider.logger.info(`${trackingId} sendButtonMessageToUser completed successfully`, { mobileNumber })
      if (orgId && socialMessageId) {
        this.saveApiResponse(orgId, trackingId, 'sendButtonMessageToUser', data, result, socialMessageId, mobileNumber)
      }
      return result
    } catch (error: any) {
      if (orgId && socialMessageId) {
        this.saveErrorResponse(orgId, trackingId, 'sendButtonMessageToUser', data, error, socialMessageId, mobileNumber)
      }
      this.printError(error, `${trackingId} Failed to send button message`)
    }
  }

  async uploadAudioMessage(params: IUploadAudioMessageParams) {
    const { mobileNumber, link, metaConfig, trackingId, orgId, socialMessageId } = params
    loggerProvider.logger.info(`${trackingId} uploadAudioMessage started`, { mobileNumber, link })
    const config = metaConfig
    const url = `${config.baseUrl}/${config.version}/${params.phoneNumberId}/messages`
    const data = {
      messaging_product: 'whatsapp',
      to: mobileNumber,
      type: 'audio',
      audio: {
        link: link,
      },
    }
    try {
      loggerProvider.logger.info(`${trackingId} Uploading audio message`, { mobileNumber, link })
      const result = await this.axiosService.post(url, data, {
        headers: {
          Authorization: `Bearer ${config.whatsapp.token}`,
          'Content-Type': 'application/json',
        },
      })
      loggerProvider.logger.info(`${trackingId} uploadAudioMessage completed successfully`, { mobileNumber })
      if (orgId && socialMessageId) {
        this.saveApiResponse(orgId, trackingId, 'uploadAudioMessage', data, result, socialMessageId, mobileNumber)
      }
      return result
    } catch (error: any) {
      if (orgId) {
        this.saveErrorResponse(orgId, trackingId, 'uploadAudioMessage', data, error, socialMessageId, mobileNumber)
      }
      this.printError(error, `${trackingId} Failed to upload audio`)
    }
  }

  async downloadWhatsappMedia(params: Omit<IDownloadWhatsappMediaParams, 'orgId' | 'socialMessageId' | 'phoneNumberId'>) {
    const { mediaId, metaConfig, trackingId } = params
    loggerProvider.logger.info(`${trackingId} downloadWhatsappMedia started`, { mediaId })
    const config = metaConfig
    const url = `${config.baseUrl}/${config.version}/${mediaId}`
    try {
      loggerProvider.logger.info(`${trackingId} Fetching media URL from WhatsApp`, { mediaId })
      const result = await this.axiosService.get(url, {
        headers: {
          Authorization: `Bearer ${config.whatsapp.token}`,
          'Content-Type': 'application/json',
        },
      })

      const mediaUrl = result.url
      if (!mediaUrl) {
        loggerProvider.logger.error(`${trackingId} Media URL not found in response`, { mediaId })
        throw new Error(Messages.WHATSAPP.MEDIA_URL_NOT_FOUND)
      }

      loggerProvider.logger.info(`${trackingId} Downloading media content`, { mediaId, mimeType: result.mime_type })
      const mediaRes = await this.axiosService.get(mediaUrl, {
        headers: {
          Authorization: `Bearer ${config.whatsapp.token}`,
          'Content-Type': 'application/json',
        },
        responseType: 'stream',
      })
      loggerProvider.logger.info(`${trackingId} downloadWhatsappMedia completed successfully`, {
        mediaId,
        mimeType: result.mime_type,
      })
      return { mime_type: result.mime_type, data: mediaRes }
    } catch (error: any) {
      this.printError(error, `${trackingId} Failed to download media`)
    }
  }

  async sendAudioMessageToUser(params: ISendAudioMessageParams) {
    const { mobileNumber, whatsappDocumentId, metaConfig, trackingId, replyToMessageId, orgId, socialMessageId } =
      params
    loggerProvider.logger.info(`${trackingId} sendAudioMessageToUser started`, { mobileNumber, whatsappDocumentId })
    const config = metaConfig
    const url = `${config.baseUrl}/${config.version}/${params.phoneNumberId}/messages`
    const data = {
      messaging_product: 'whatsapp',
      to: mobileNumber,
      type: 'audio',
      audio: {
        id: whatsappDocumentId,
      },
    } as any
    if (replyToMessageId) {
      data['context'] = {
        message_id: replyToMessageId,
      }
    }
    try {
      loggerProvider.logger.info(`${trackingId} Sending audio message to user`, { mobileNumber, whatsappDocumentId })
      const result = await this.axiosService.post(url, data, {
        headers: {
          Authorization: `Bearer ${config.whatsapp.token}`,
          'Content-Type': 'application/json',
        },
      })
      loggerProvider.logger.info(`${trackingId} sendAudioMessageToUser completed successfully`, { mobileNumber })
      if (orgId && socialMessageId) {
        this.saveApiResponse(orgId, trackingId, 'sendAudioMessageToUser', data, result, socialMessageId, mobileNumber)
      }
      return result
    } catch (error: any) {
      if (orgId && socialMessageId) {
        this.saveErrorResponse(orgId, trackingId, 'sendAudioMessageToUser', data, error, socialMessageId, mobileNumber)
      }
      this.printError(error, `${trackingId} Failed to send audio message`)
    }
  }

  async sendAppointmentStatusTemplate(params: ISendAppointmentStatusTemplateParams) {
    const { mobileNumber, metaConfig, template, trackingId, params: appointmentParams, orgId, socialMessageId } = params
    loggerProvider.logger.info(`${trackingId} sendCancelAppointmentTemplate started`, {
      mobileNumber,
      params: appointmentParams,
    })
    const config = metaConfig
    const url = `${config.baseUrl}/${config.version}/${params.phoneNumberId}/messages`
    const data = {
      messaging_product: 'whatsapp',
      to: mobileNumber,
      type: 'template',
      template: {
        name: template.id,
        language: {
          code: template.languageCode,
        },
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: appointmentParams.status },
              { type: 'text', text: appointmentParams.name },
              { type: 'text', text: appointmentParams.appointmentType },
              { type: 'text', text: appointmentParams.date },
              { type: 'text', text: appointmentParams.time },
            ],
          },
        ],
      },
    }
    try {
      loggerProvider.logger.info(`${trackingId} Sending cancel appointment template`, {
        mobileNumber,
        params: appointmentParams,
      })
      const result = await this.axiosService.post(url, data, {
        headers: {
          Authorization: `Bearer ${config.whatsapp.token}`,
          'Content-Type': 'application/json',
        },
      })
      loggerProvider.logger.info(`${trackingId} sendCancelAppointmentTemplate completed successfully`, {
        mobileNumber,
      })
      if (orgId && socialMessageId) {
        this.saveApiResponse(
          orgId,
          trackingId,
          'sendAppointmentStatusTemplate',
          data,
          result,
          socialMessageId,
          mobileNumber,
        )
      }
      return result
    } catch (error: any) {
      if (orgId && socialMessageId) {
        this.saveErrorResponse(
          orgId,
          trackingId,
          'sendAppointmentStatusTemplate',
          data,
          error,
          socialMessageId,
          mobileNumber,
        )
      }
      this.printError(error, `${trackingId} Failed to send cancel appointment template`)
    }
  }

  async sendAddressTemplate(params: ISendAddressTemplateParams) {
    const { mobileNumber, metaConfig, template, trackingId, orgId, socialMessageId } = params
    loggerProvider.logger.info(`${trackingId} sendAddressTemplate started`, { mobileNumber })
    const config = metaConfig
    const url = `${config.baseUrl}/${config.version}/${params.phoneNumberId}/messages`
    const data = {
      messaging_product: 'whatsapp',
      to: mobileNumber,
      type: 'template',
      template: {
        name: template.id,
        language: {
          code: template.languageCode,
        },
        components: [
          {
            type: 'button',
            sub_type: 'quick_reply',
            index: '0',
            parameters: [
              {
                type: 'payload',
                payload: 'ગુજરાતીમાં સરનામું',
              },
            ],
          },
          {
            type: 'button',
            sub_type: 'quick_reply',
            index: '1',
            parameters: [
              {
                type: 'payload',
                payload: 'हिंदी में पता',
              },
            ],
          },
        ],
      },
    } as any

    try {
      loggerProvider.logger.info(`${trackingId} Sending address template`, {
        mobileNumber,
      })
      const result = await this.axiosService.post(url, data, {
        headers: {
          Authorization: `Bearer ${config.whatsapp.token}`,
          'Content-Type': 'application/json',
        },
      })
      loggerProvider.logger.info(`${trackingId} sendAddressTemplate completed successfully`, {
        mobileNumber,
      })
      if (orgId && socialMessageId) {
        this.saveApiResponse(orgId, trackingId, 'sendAddressTemplate', data, result, socialMessageId, mobileNumber)
      }
      return result
    } catch (error: any) {
      if (orgId) {
        this.saveErrorResponse(orgId, trackingId, 'sendAddressTemplate', data, error, socialMessageId, mobileNumber)
      }
      this.printError(error, `${trackingId} Failed to send address template`)
    }
  }

  async sendAudioMessageToUserWithUrl(params: ISendAudioMessageWithUrlParams) {
    const { mobileNumber, publicUrl, metaConfig, trackingId, replyToMessageId, orgId, socialMessageId } = params
    loggerProvider.logger.info(`${trackingId} sendAudioMessageToUserWithUrl started`, { mobileNumber, publicUrl })
    const config = metaConfig
    const url = `${config.baseUrl}/${config.version}/${params.phoneNumberId}/messages`
    const data = {
      messaging_product: 'whatsapp',
      to: mobileNumber,
      type: 'audio',
      audio: { link: publicUrl },
    } as any
    if (replyToMessageId) {
      data['context'] = {
        message_id: replyToMessageId,
      }
    }
    try {
      loggerProvider.logger.info(`${trackingId} Sending audio message with URL to user`, { mobileNumber, publicUrl })
      const result = await this.axiosService.post(url, data, {
        headers: {
          Authorization: `Bearer ${config.whatsapp.token}`,
          'Content-Type': 'application/json',
        },
      })
      loggerProvider.logger.info(`${trackingId} sendAudioMessageToUserWithUrl completed successfully`, { mobileNumber })
      if (orgId && socialMessageId) {
        this.saveApiResponse(
          orgId,
          trackingId,
          'sendAudioMessageToUserWithUrl',
          data,
          result,
          socialMessageId,
          mobileNumber,
        )
      }
      return result
    } catch (error: any) {
      if (orgId) {
        this.saveErrorResponse(
          orgId,
          trackingId,
          'sendAudioMessageToUserWithUrl',
          data,
          error,
          socialMessageId,
          mobileNumber,
        )
      }
      this.printError(error, `${trackingId} Failed to send audio message with URL`)
    }
  }

  async sendTemplateMessage(params: ISendWhatsAppTemplateMessageParams) {
    const { mobileNumber, metaConfig, template, buttons, trackingId, bodyParameters, orgId, socialMessageId } = params
    loggerProvider.logger.info(`${trackingId} sendTemplateMessage started`, { mobileNumber, templateName: template.id })
    const config = metaConfig
    const url = `${config.baseUrl}/${config.version}/${params.phoneNumberId}/messages`

    const components: any[] = []

    // Build header component with media (from documents or legacy imageUrl)
    const headerDoc = template.documents?.headers?.[0]

    if (headerDoc) {
      // WhatsApp Cloud API does NOT support 'audio' in template headers — fallback to document
      const mediaType = headerDoc.type === 'audio' ? 'document' : headerDoc.type
      components.push({
        type: 'header',
        parameters: [
          {
            type: mediaType,
            [mediaType]: {
              link: headerDoc.link,
            },
          },
        ],
      })
    }

    // Build body component from user's bodyParameters
    if (bodyParameters && bodyParameters.length > 0) {
      components.push({
        type: 'body',
        parameters: bodyParameters.map(text => ({ type: 'text', text })),
      })
    }

    // Add button/header components from template config (static values stored in org config)
    if (buttons && buttons.length > 0) {
      for (let index = 0; index < buttons.length; index++) {
        components.push({
          type: 'button',
          sub_type: 'quick_reply',
          index: index.toString(),
          parameters: [
            {
              type: 'payload',
              payload: buttons[index],
            },
          ],
        })
      }
    }
    const data = {
      messaging_product: 'whatsapp',
      to: mobileNumber,
      type: 'template',
      template: {
        name: template.id,
        language: {
          code: template.languageCode,
        },
        ...(components.length > 0 && { components }),
      },
    }

    try {
      loggerProvider.logger.info(`${trackingId} Sending template message`, { mobileNumber, templateName: template.id })
      const result = await this.axiosService.post(url, data, {
        headers: {
          Authorization: `Bearer ${config.whatsapp.token}`,
          'Content-Type': 'application/json',
        },
      })
      loggerProvider.logger.info(`${trackingId} sendTemplateMessage completed successfully`, { mobileNumber })
      if (orgId && socialMessageId) {
        this.saveApiResponse(orgId, trackingId, 'sendTemplateMessage', data, result, socialMessageId, mobileNumber)
      }
      return result
    } catch (error: any) {
      if (orgId) {
        this.saveErrorResponse(orgId, trackingId, 'sendTemplateMessage', data, error, socialMessageId, mobileNumber)
      }
      this.printError(error, `${trackingId} Failed to send template message`)
    }
  }

  async sendTemplateMessageMessageToDr(params: ISendWhatsAppTemplateMessageParams) {
    const { mobileNumber, metaConfig, template, trackingId, bodyParameters, orgId, socialMessageId, buttons } = params
    loggerProvider.logger.info(`${trackingId} sendTemplateMessageMessageToDr started`, {
      mobileNumber,
      templateName: template.id,
    })
    const config = metaConfig
    const url = `${config.baseUrl}/${config.version}/${params.phoneNumberId}/messages`

    const components: any[] = []

    // Build header component with media (from documents or legacy imageUrl)

    // Build body component from user's bodyParameters
    if (bodyParameters && bodyParameters.length > 0) {
      components.push({
        type: 'body',
        parameters: bodyParameters.map(text => ({ type: 'text', text })),
      })
    }

    // Add button/header components from template config (static values stored in org config)
    if (buttons.length > 0) {
      for (let index = 0; index < buttons.length; index++) {
        components.push({
          type: 'button',
          sub_type: 'url',
          index: index.toString(),
          parameters: [
            {
              type: 'text',
              text: buttons[index],
            },
          ],
        })
      }
    }
    const data = {
      messaging_product: 'whatsapp',
      to: mobileNumber,
      type: 'template',
      template: {
        name: template.id,
        language: {
          code: template.languageCode,
        },
        ...(components.length > 0 && { components }),
      },
    }

    try {
      loggerProvider.logger.info(`${trackingId} Sending template message`, { mobileNumber, templateName: template.id })
      const result = await this.axiosService.post(url, data, {
        headers: {
          Authorization: `Bearer ${config.whatsapp.token}`,
          'Content-Type': 'application/json',
        },
      })
      loggerProvider.logger.info(`${trackingId} sendTemplateMessageMessageToDr completed successfully`, {
        mobileNumber,
      })
      if (orgId && socialMessageId) {
        this.saveApiResponse(
          orgId,
          trackingId,
          'sendTemplateMessageMessageToDr',
          data,
          result,
          socialMessageId,
          mobileNumber,
        )
      }
      return result
    } catch (error: any) {
      if (orgId) {
        this.saveErrorResponse(
          orgId,
          trackingId,
          'sendTemplateMessageMessageToDr',
          data,
          error,
          socialMessageId,
          mobileNumber,
        )
      }
      this.printError(error, `${trackingId} Failed to send template message`)
    }
  }

  async sendDynamicTemplateMessage(params: ISendDynamicTemplateParams) {
    const { mobileNumber, metaConfig, template, variables, trackingId, orgId, socialMessageId, phoneNumberId } = params
    loggerProvider.logger.info(`${trackingId} sendDynamicTemplateMessage started`, {
      mobileNumber,
      templateName: template.id,
    })
    const sourceComponents = params.components && params.components.length > 0
      ? params.components
      : template.components
    if (!sourceComponents || sourceComponents.length === 0) {
      throw new Error(`Template ${template.id} has no components defined`)
    }
    const { components, missingKeys } = renderTemplateComponentsDetailed(sourceComponents, variables ?? {})
    if (missingKeys.length > 0) {
      loggerProvider.logger.warn(`${trackingId} sendDynamicTemplateMessage missing dynamic keys`, {
        mobileNumber,
        templateName: template.id,
        missingKeys,
      })
    }
    const url = `${metaConfig.baseUrl}/${metaConfig.version}/${phoneNumberId}/messages`
    const data = {
      messaging_product: 'whatsapp',
      to: mobileNumber,
      type: 'template',
      template: {
        name: template.id,
        language: { code: template.languageCode },
        components,
      },
    }
    try {
      loggerProvider.logger.info(`${trackingId} Sending dynamic template message`, {
        mobileNumber,
        templateName: template.id,
      })
      const result = await this.axiosService.post(url, data, {
        headers: {
          Authorization: `Bearer ${metaConfig.whatsapp.token}`,
          'Content-Type': 'application/json',
        },
      })
      loggerProvider.logger.info(`${trackingId} sendDynamicTemplateMessage completed successfully`, { mobileNumber })
      if (orgId && socialMessageId) {
        this.saveApiResponse(orgId, trackingId, 'sendDynamicTemplateMessage', data, result, socialMessageId, mobileNumber)
      }
      return result
    } catch (error: any) {
      if (orgId) {
        this.saveErrorResponse(orgId, trackingId, 'sendDynamicTemplateMessage', data, error, socialMessageId, mobileNumber)
      }
      this.printError(error, `${trackingId} Failed to send dynamic template`)
    }
  }

  printError(error: any, message: string): never {
    if (error?.response?.data?.error) {
      loggerProvider.logger.error(message, { error: error.response.data.error, stack: error.stack })
    } else {
      loggerProvider.logger.error(message, { error: error, stack: error.stack })
    }

    throw { message: Messages.WHATSAPP.API_ERROR }
  }

  printErrorWithoutThrowError(error: any, message: string) {
    if (error?.response?.data?.error) {
      loggerProvider.logger.error(message, { error: error.response.data.error, stack: error.stack })
    } else {
      loggerProvider.logger.error(message, { error: error, stack: error.stack })
    }
  }

  public static get Instance() {
    if (isNil(this.instance)) this.instance = new this()

    return this.instance
  }
}
