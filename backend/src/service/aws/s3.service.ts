import { Response } from 'express'
import { IncomingHttpHeaders } from 'http2'
import { isNil } from 'lodash'
import { awsConfigurationKey } from '../../config'
import { awsConfig, s3Client } from './config.service'
import { Upload } from '@aws-sdk/lib-storage'
import { LoggerProvider } from '../../provider'
import { MongoS3TempKeyRepository } from '@anantai/common'
import { S3MetaData } from '../../typings'

const loggerProvider = LoggerProvider.Instance

export class S3Service {
  private static instance: S3Service
  private readonly s3TempKeyRepository: MongoS3TempKeyRepository
  constructor() {
    this.s3TempKeyRepository = new MongoS3TempKeyRepository()
  }

  s3 = new awsConfig.S3()
  async getImageUploadSignInUrl(key: string, imageType: string): Promise<string> {
    try {
      const url = await this.s3.getSignedUrlPromise('putObject', {
        Bucket: awsConfigurationKey.s3Config.bucketName,
        Key: key,
        ContentType: imageType,
        Expires: awsConfigurationKey.s3Config.expireTimeForPrivateUrl,
      })
      return url
    } catch (error: any) {
      loggerProvider.logger.error('getImageUploadSignInUrl_Error', {
        error: error.message,
        stack: error.stack,
        key,
        imageType,
      })
      throw error
    }
  }

  async getImageUploadUrlAndGetInfo(
    key: string,
    contentType: string,
    orgId: string,
    metaData: S3MetaData = {},
  ): Promise<{ url: string; keyId: string }> {
    try {
      const url = await this.s3.getSignedUrlPromise('putObject', {
        Bucket: awsConfigurationKey.s3Config.bucketName,
        Key: key,
        ContentType: contentType,
        Expires: awsConfigurationKey.s3Config.expireTimeForPrivateUrl,
      })
      const s3Key = await this.getS3Key(key, contentType, orgId, metaData)
      return { url, ...s3Key }
    } catch (error: any) {
      loggerProvider.logger.error('getImageUploadSignInUrl_Error', {
        error: error.message,
        stack: error.stack,
        key,
      })
      throw error
    }
  }

  async getPublicUploadSignedUrl(key: string, contentType: string): Promise<string> {
    try {
      const url = await this.s3.getSignedUrlPromise('putObject', {
        Bucket: awsConfigurationKey.s3Config.publicBucketName,
        Key: key,
        ContentType: contentType,
        Expires: awsConfigurationKey.s3Config.expireTimeForPrivateUrl,
      })
      return url
    } catch (error: any) {
      loggerProvider.logger.error('getPublicUploadSignedUrl_Error', {
        error: error.message,
        stack: error.stack,
        key,
        contentType,
      })
      throw error
    }
  }

  async getImageDownloadSignInUrl(
    key: string,
    expires = awsConfigurationKey.s3Config.expireTimeForPrivateUrl,
    overrides: { responseContentType?: string; responseContentDisposition?: string } = {},
  ): Promise<string> {
    try {
      const params: any = {
        Bucket: awsConfigurationKey.s3Config.bucketName,
        Key: key,
        Expires: expires,
      }
      // Force the response Content-Type / Content-Disposition the browser
      // will see, regardless of what was stored on the object at upload
      // time. Fixes "corrupt file" downloads when the S3 object was
      // uploaded without a Content-Type (browser ends up rendering the
      // bytes as text/plain).
      if (overrides.responseContentType) params.ResponseContentType = overrides.responseContentType
      if (overrides.responseContentDisposition) params.ResponseContentDisposition = overrides.responseContentDisposition
      const url = await this.s3.getSignedUrlPromise('getObject', params)
      return url
    } catch (error: any) {
      loggerProvider.logger.error('getImageDownloadSignInUrl_Error', {
        error: error.message,
        stack: error.stack,
        key,
        expires,
      })
      throw error
    }
  }

  /**
   * Replace each report's raw S3 `fileUrl` (key) in-place with a presigned
   * GET URL. Skips entries that are already fully-qualified URLs and entries
   * with no key. Used by every list endpoint that returns embedded reports
   * (visits, activities, patient timeline). Without this, the frontend sees
   * a relative path and clicking download saves the SPA's index.html ⇒
   * looks like a "corrupt file" to the user.
   */
  async signReportFileUrlsInPlace(reports: any[]): Promise<void> {
    if (!Array.isArray(reports) || reports.length === 0) return
    await Promise.all(
      reports.map(async (report: any) => {
        const key: string | undefined = report?.fileUrl
        if (!key || typeof key !== 'string') return
        if (/^https?:\/\//i.test(key)) return
        try {
          const keyBasename = key.split('/').pop() || ''
          const keyExt = keyBasename.includes('.') ? keyBasename.slice(keyBasename.lastIndexOf('.')) : ''
          const userName: string = (report.fileName && String(report.fileName).trim()) || keyBasename || 'report'
          const downloadName = userName.includes('.') ? userName : `${userName}${keyExt}`
          const contentType = report.fileType && String(report.fileType).trim()
            ? String(report.fileType)
            : undefined
          const disposition = `inline; filename="${downloadName.replace(/"/g, '')}"; filename*=UTF-8''${encodeURIComponent(downloadName)}`
          report.fileUrl = await this.getImageDownloadSignInUrl(key, undefined, {
            responseContentType: contentType,
            responseContentDisposition: disposition,
          })
        } catch (err: any) {
          loggerProvider.logger.error('signReportFileUrlsInPlace_Error', {
            error: err.message,
            key,
            reportId: report?._id,
          })
          report.fileUrl = ''
        }
      }),
    )
  }

  async getFIleData(key: string, res: Response): Promise<void> {
    try {
      return new Promise((resolve) => {
        this.s3.getObject(
          {
            Bucket: awsConfigurationKey.s3Config.bucketName,
            Key: key,
          },
          function (err: any, data: any) {
            if (!isNil(err)) {
              res.status(200)
              res.end('Error Fetching File')
              resolve()
            } else {
              res.attachment(key) // Set Filename
              res.type(data.ContentType ?? '') // Set FileType
              res.send(data.Body) // Send File Buffer
              resolve()
            }
          },
        )
      })
    } catch (error: any) {
      loggerProvider.logger.error('getFIleData_Error', { error: error.message, stack: error.stack, key })
      throw error
    }
  }

  async uploadBufferToS3(buffer: Buffer, s3Key: string, contentType: string): Promise<string> {
    try {
      const upload = new Upload({
        client: s3Client,
        params: {
          Bucket: awsConfigurationKey.s3Config.bucketName,
          Key: s3Key,
          Body: buffer,
          ContentType: contentType,
        },
      })
      await upload.done()
      return s3Key
    } catch (error: any) {
      loggerProvider.logger.error('uploadBufferToS3_Error', {
        error: error.message,
        stack: error.stack,
        s3Key,
        contentType,
      })
      throw error
    }
  }

  async getObjectBuffer(s3Key: string): Promise<Buffer> {
    try {
      return new Promise((resolve, reject) => {
        this.s3.getObject(
          { Bucket: awsConfigurationKey.s3Config.bucketName, Key: s3Key },
          (err: any, data: any) => {
            if (err) return reject(err)
            resolve(Buffer.from(data.Body as any))
          },
        )
      })
    } catch (error: any) {
      loggerProvider.logger.error('getObjectBuffer_Error', {
        error: error.message,
        stack: error.stack,
        s3Key,
      })
      throw error
    }
  }

  async streamWhatsAppMediaToS3(data: any, mimeType: string, s3Key: string): Promise<void> {
    try {
      const params = {
        Bucket: awsConfigurationKey.s3Config.bucketName,
        Key: s3Key,
        Body: data, // Axios stream
        ContentType: mimeType,
      }
      const upload = new Upload({
        client: s3Client,
        params,
      })
      await upload.done()
    } catch (error: any) {
      // Destroy the incoming stream to prevent memory leak
      if (data && typeof data.destroy === 'function') {
        data.destroy()
      }
      loggerProvider.logger.error('streamWhatsAppMediaToS3_Error', {
        error: error.message,
        stack: error.stack,
        mimeType,
        s3Key,
      })
      throw error
    }
  }

  async awsStream(data: { key: string; mimeType: string }, headers: IncomingHttpHeaders, response: Response) {
    try {
      return new Promise<void>((resolve) => {
        try {
          const file = data.key
          const bucket = awsConfigurationKey.s3Config.bucketName
          let s3Stream: NodeJS.ReadableStream

          if (!isNil(headers) && !isNil(headers.range)) {
            const range = headers.range
            const bytes = range.replace(/bytes=/, '').split('-')
            const start = parseInt(bytes[0], 10)
            const end = bytes[1] ? parseInt(bytes[1], 10) : 1
            const chunksize = end - start + 1

            response.writeHead(206, {
              'Accept-Ranges': 'bytes',
              'Content-Length': chunksize,
              authorize: 'true',
              'Cache-Control': 'max-age=3600, private',
            })

            s3Stream = this.s3.getObject({ Bucket: bucket, Key: file, Range: range }).createReadStream()
          } else {
            response.writeHead(200, {
              'Cache-Control': 'max-age=3600, private',
              authorize: 'true',
            })
            s3Stream = this.s3.getObject({ Bucket: bucket, Key: file }).createReadStream()
          }

          s3Stream.on('error', (err) => {
            loggerProvider.logger.error('awsStream_S3StreamError', { error: (err as Error).message, key: file })
            if (!response.headersSent) {
              response.status(500).send({ message: 'Error streaming file' })
            }
            resolve()
          })

          response.on('close', () => {
            if (s3Stream && typeof (s3Stream as any).destroy === 'function') {
              (s3Stream as any).destroy()
            }
            resolve()
          })

          s3Stream.pipe(response)
        } catch (err) {
          response.status(404).send({ message: 'Internal error' })
          resolve()
        }
      })
    } catch (error: any) {
      loggerProvider.logger.error('awsStream_Error', {
        error: error.message,
        stack: error.stack,
        key: data.key,
        mimeType: data.mimeType,
      })
      throw error
    }
  }

  async getPublicUploadSignedUrlAndCreateTempBucket(
    key: string,
    contentType: string,
    orgId: string,
    metaData: S3MetaData = {},
  ): Promise<{ uploadUrl: string; keyId: string }> {
    try {
      const url = await this.getImageUploadSignInUrl(key, contentType)
      const saved = await this.s3TempKeyRepository.saveS3TempKey({
        s3Key: key,
        orgId: orgId as any,
        metaData: metaData ?? {},
        s3PublicUrl: '',
        expiresAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        isDelete: false,
      })

      return {
        uploadUrl: url,
        keyId: (saved._id ?? saved.id) as any,
      }
    } catch (error: any) {
      loggerProvider.logger.error('getPublicUploadSignedUrlAndCreateTempBucket_error', {
        error: error.message,
        stack: error.stack,
        key,
        contentType,
      })
      throw error
    }
  }

  async getS3Key(
    key: string,
    contentType: string,
    orgId: string,
    metaData: S3MetaData = {},
  ): Promise<{ keyId: string }> {
    try {
      //  const url = await this.getImageUploadSignInUrl(key, contentType)
      const saved = await this.s3TempKeyRepository.saveS3TempKey({
        s3Key: key,
        orgId: orgId as any,
        metaData: metaData ?? {},
        s3PublicUrl: '',
        expiresAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        isDelete: false,
      })

      return {
        keyId: (saved._id ?? saved.id) as any,
      }
    } catch (error: any) {
      loggerProvider.logger.error('getPublicUploadSignedUrlAndCreateTempBucket_error', {
        error: error.message,
        stack: error.stack,
        key,
        contentType,
      })
      throw error
    }
  }

  /**
   * Move one file from temp to permanent folder
   */
  async moveObject(
    oldKey: string,
    newKey: string,
    oldBucketName = awsConfigurationKey.s3Config.publicBucketName,
  ): Promise<void> {
    const bucket = awsConfigurationKey.s3Config.bucketName
    await this.s3
      .copyObject({
        Bucket: bucket,
        CopySource: `${oldBucketName}/${oldKey}`,
        Key: newKey,
        MetadataDirective: 'COPY',
      })
      .promise()

    await this.s3
      .deleteObject({
        Bucket: oldBucketName,
        Key: oldKey,
      })
      .promise()

    console.log(`Moved: ${oldKey} -> ${newKey}`)
  }
  /**
   * Generate a temporary PUBLIC download URL for private S3 objects
   * Works for WhatsApp Cloud API (audio, video, images, docs)
   */
  async getPublicDownloadSignedUrl(
    key: string,
    expires = awsConfigurationKey.s3Config.expireTimeForPrivateUrl,
  ): Promise<string> {
    try {
      const url = await this.s3.getSignedUrlPromise('getObject', {
        Bucket: awsConfigurationKey.s3Config.bucketName,
        Key: key,
        Expires: expires,
      })

      return url
    } catch (error: any) {
      loggerProvider.logger.error('getPublicDownloadSignedUrl_Error', {
        error: error.message,
        stack: error.stack,
        key,
        expires,
      })
      throw error
    }
  }

  public static get Instance() {
    try {
      if (isNil(this.instance)) this.instance = new this()

      return this.instance
    } catch (error: any) {
      loggerProvider.logger.error('Instance_Error', { error: error.message, stack: error.stack })
      throw error
    }
  }
}
