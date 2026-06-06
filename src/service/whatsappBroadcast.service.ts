import { isNil } from 'lodash'
import { LoggerProvider } from '../provider'
import { S3Service } from './aws/s3.service'
import {  MediaTypeEnum, MessageDirection } from '../typings'
import type { WhatsappMediaTypeUnion } from '../dto'

const loggerProvider = LoggerProvider.Instance

// WhatsApp Cloud API supported media MIME types per category.
// Keep this aligned with https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages
const CONTENT_TYPE_MAP: Record<WhatsappMediaTypeUnion, Record<string, string>> = {
  image: {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
  },
  audio: {
    mp3: 'audio/mpeg',
    ogg: 'audio/ogg',
    amr: 'audio/amr',
    aac: 'audio/aac',
  },
  video: {
    mp4: 'video/mp4',
    '3gp': 'video/3gpp',
  },
  document: {
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    txt: 'text/plain',
    csv: 'text/csv',
  },
}

export class WhatsappBroadcastService {
  private static instance: WhatsappBroadcastService
  private readonly s3Service = S3Service.Instance
//   private readonly whatsAppChatService = WhatsAppChatService.Instance
//   private readonly organizationConfigurationService = OrganizationConfigurationService.Instance
//   private readonly s3TempKeyRepository = new MongoS3TempKeyRepository()

  async generateMediaUploadUrl(
    mediaType: WhatsappMediaTypeUnion,
    fileName: string,
    orgId: string,
    socialId: string,
  ): Promise<{ uploadUrl: string; s3Key: string; keyId: string; contentType: string }> {
    const extension = fileName.split('.').pop()?.toLowerCase() ?? ''
    const contentTypeMapping = CONTENT_TYPE_MAP[mediaType]

    if (!contentTypeMapping || !contentTypeMapping[extension]) {
      throw new Error(`Invalid file extension '${extension}' for media type '${mediaType}'`)
    }

    const contentType = contentTypeMapping[extension]
    const timestamp = Date.now()
    const s3Key = `${orgId}/${socialId}/${MessageDirection.OUTBOUND}/${timestamp}-${fileName}`

    // Persist socialId + mediaType + filename on the temp-key so the send-media
    // endpoint can look them up by keyId without trusting client-side payload.
    const { uploadUrl, keyId } = await this.s3Service.getPublicUploadSignedUrlAndCreateTempBucket(
      s3Key,
      contentType,
      orgId,
      {
        socialId,
        fileName,
        fileType: contentType,
        mediaType: mediaType as MediaTypeEnum,
      },
    )

    loggerProvider.logger.info('generateMediaUploadUrl success', { s3Key, keyId, orgId, mediaType })

    return { uploadUrl, s3Key, keyId, contentType }
  }

//   async sendMediaToUser(
//     mobileNumber: string,
//     mediaFiles: MediaFileItem[],
//     orgId: string,
//   ): Promise<{ message: string; total: number; results: SendMediaResult[] }> {
//     const trackingId = uuidv4()
//     loggerProvider.logger.info(`${trackingId} sendMediaToUser started`, { mobileNumber, totalFiles: mediaFiles.length })

//     const orgConfig = await this.organizationConfigurationService.getOrganizationConfiguration(orgId)
//     const metaConfig: IMetaAttributes = orgConfig.metaAttributes

//     const results: SendMediaResult[] = []

//     for (const file of mediaFiles) {
//       try {
//         const s3TempKey = await this.s3TempKeyRepository.getS3TempKey({ _id: toObjectId(file.keyId), orgId: toObjectId(orgId) })
//         if (!s3TempKey) {
//           results.push({ keyId: file.keyId, mediaType: file.mediaType, status: 'failed', error: 'S3 key not found' })
//           continue
//         }

//         const downloadUrl = await this.s3Service.getPublicDownloadSignedUrl(s3TempKey.s3Key)

//         const baseParams = {
//           metaConfig,
//           trackingId,
//           orgId,
//           socialMessageId: '0',
//         }

//         switch (file.mediaType) {
//           case 'video':
//             await this.whatsAppChatService.sendVideoToUser({
//               ...baseParams,
//               mobileNumber,
//               videoLinkUrl: downloadUrl,
//               captionText: file.caption ?? '',
//             })
//             break
//           case 'audio':
//             await this.whatsAppChatService.uploadAudioMessage({
//               ...baseParams,
//               mobileNumber,
//               link: downloadUrl,
//             })
//             break
//           case 'image':
//             await this.whatsAppChatService.sendImageToUser({
//               ...baseParams,
//               mobileNumber,
//               imageUrl: downloadUrl,
//               caption: file.caption,
//             })
//             break
//           default:
//             results.push({ keyId: file.keyId, mediaType: file.mediaType, status: 'failed', error: 'Unsupported media type' })
//             continue
//         }

//         results.push({ keyId: file.keyId, mediaType: file.mediaType, status: 'sent' })
//         await this.s3TempKeyRepository.removeS3TempKey({ _id: toObjectId(file.keyId), orgId: toObjectId(orgId) })
//         loggerProvider.logger.info(`${trackingId} Media sent successfully`, { keyId: file.keyId, mediaType: file.mediaType })
//       } catch (error: any) {
//         loggerProvider.logger.error(`${trackingId} Failed to send media`, { keyId: file.keyId, error: error.message })
//         results.push({ keyId: file.keyId, mediaType: file.mediaType, status: 'failed', error: error.message ?? 'WhatsApp API error' })
//       }
//     }
//     loggerProvider.logger.info(`${trackingId} sendMediaToUser completed`, {
//       mobileNumber,
//       total: mediaFiles.length,
//       sent: results.filter(r => r.status === 'sent').length,
//       failed: results.filter(r => r.status === 'failed').length,
//     })

//     return { message: 'Media sent', total: mediaFiles.length, results }
//   }

  public static get Instance() {
    if (isNil(this.instance)) this.instance = new this()
    return this.instance
  }
}
