import { SocialMediaType, IMetaAttributes } from '../../typings'
import { LoggerProvider } from '../../provider'
import { AxiosService } from '../axios.service'
import { isNil } from 'lodash'
import { InstagramService } from './InstgramChat'
import { WhatsAppChatService } from './whatsAppChat'
const loggerProvider = LoggerProvider.Instance
export class MetaService {
  private static instance: MetaService
  private readonly axiosService = AxiosService.Instance
  constructor() {
    this.axiosService = AxiosService.Instance
  }

  async getLeadData(leadId: string, metaConfig: IMetaAttributes): Promise<any> {
    const config = metaConfig
    const url = `${config.baseUrl}/${config.version}/${leadId}?fields=${config.facebookLead.fields}&access_token=${config.userAccessToken}`
    try {
      const result = await this.axiosService.get(url, {
        headers: {
          'Content-Type': 'application/json',
        },
      })
      return result.data
    } catch (error: any) {
      loggerProvider.logger.error('Failed to get lead:', error)
      throw error
    }
  }



  async sendButtonMessage(
    socialMediaType: SocialMediaType,
    recipientId: string,
    messages: string,
    buttons: string[],
    metaConfig: IMetaAttributes,
    trackingId: string,
    orgId: string,
    socialMessageId: string,
    phoneNumberId: string,
    messageId?: string | null | undefined,
  ) {
    switch (socialMediaType) {
      case SocialMediaType.WHATSAPP: {
        return await WhatsAppChatService.Instance.sendButtonMessageToUser({
          mobileNumber: recipientId,
          messages,
          buttons,
          metaConfig,
          trackingId,
          orgId,
          phoneNumberId,
          socialMessageId,
          replyToMessageId: messageId,
        })
      }
    }
  }

  async downloadMedia(
    socialMediaType: SocialMediaType,
    mediaId: string,
    metaConfig: IMetaAttributes,
    trackingId: string
  ): Promise<{ mime_type: string; data: any }> {
    switch (socialMediaType) {
      case SocialMediaType.INSTAGRAM: {
        return await InstagramService.Instance.downloadInstagramMedia(mediaId, metaConfig)
      }
      case SocialMediaType.WHATSAPP: {
        return await WhatsAppChatService.Instance.downloadWhatsappMedia({
          mediaId,
          metaConfig,
          trackingId
        })
      }
    }
    return { mime_type: '', data: '' }
  }

  public static get Instance() {
    if (isNil(this.instance)) this.instance = new this()

    return this.instance
  }
}
