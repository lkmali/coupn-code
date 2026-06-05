import { LoggerProvider } from '../../provider'
import { AxiosService } from '../axios.service'
import { isNil } from 'lodash'
import { IMetaAttributes } from '../../typings'
const loggerProvider = LoggerProvider.Instance
export class InstagramService {
  private static instance: InstagramService
  private readonly axiosService = AxiosService.Instance
  constructor() {
    this.axiosService = AxiosService.Instance
  }
  async sendTextMessageToUser(recipientId: string, messages: string, metaConfig: IMetaAttributes) {
    try {
      const config = metaConfig
      const url = `${config.baseUrl}/${config.version}/${config.instagram.userId}/messages`
      const data = {
        recipient: { id: recipientId },
        message: { messages },
      }
      loggerProvider.logger.info('Send message to ', recipientId)
      const result = await this.axiosService.post(url, data, {
        headers: {
          Authorization: `Bearer ${config.instagram.token}`,
          'Content-Type': 'application/json',
        },
      })
      return result
    } catch (error: any) {
      loggerProvider.logger.error('sendTextMessageToUser_Error', {
        error: error.message,
        stack: error.stack,
        recipientId,
      })
      throw error
    }
  }

  async sendTextMessageToUserForBasicInfo(recipientId: string, metaConfig: IMetaAttributes) {
    try {
      const config = metaConfig
      const url = `${config.baseUrl}/${config.version}/${config.instagram.userId}/messages`
      const data = {
        recipient: { id: recipientId },
        message: {
          text: 'Please share your contact preference:',
          quick_replies: [
            { content_type: 'user_phone_number' },
            { content_type: 'user_name' },
            { content_type: 'user_email' },
          ],
        },
      }
      loggerProvider.logger.info('Send message to Instagram ', recipientId)
      const result = await this.axiosService.post(url, data, {
        headers: {
          Authorization: `Bearer ${config.instagram.token}`,
          'Content-Type': 'application/json',
        },
      })
      return result
    } catch (error: any) {
      loggerProvider.logger.error('sendTextMessageToUserForBasicInfo_Error', {
        error: error.message,
        stack: error.stack,
        recipientId,
      })
      throw error
    }
  }

  async downloadInstagramMedia(mediaId: string, metaConfig: IMetaAttributes) {
    try {
      const config = metaConfig
      const url = `${config.baseUrl}/${config.version}/${mediaId}?access_token=${config.instagram.token}`
      const result = await this.axiosService.get(url, {
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const mediaUrl = result.url
      if (!mediaUrl) throw new Error('Media URL not found')

      const mediaRes = await this.axiosService.get(mediaUrl, {
        headers: {
          Authorization: `Bearer ${config.instagram.token}`,
          'Content-Type': 'application/json',
        },
        responseType: 'stream',
      })

      return { mime_type: result.mime_type, data: mediaRes }
    } catch (error: any) {
      loggerProvider.logger.error('downloadInstagramMedia_Error', {
        error: error.message,
        stack: error.stack,
        mediaId,
      })
      throw error
    }
  }

  public static get Instance() {
    if (isNil(this.instance)) this.instance = new this()

    return this.instance
  }
}
