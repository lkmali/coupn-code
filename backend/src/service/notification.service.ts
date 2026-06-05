import { isNil } from 'lodash'
import { envConfig, constantConfig } from '../config'
import { generateRandomOTP } from '../utils'
import { LoggerProvider } from '../provider'
import { MongoTokenRepository } from '@anantai/common'
import { EmailRequest, EmailTemplateRequest, EmailWithAttachmentRequest, ITokens, PasswordMailRequest } from '../typings'
import { EmailService } from './aws'
import { EmailTemplateService } from './email/emailTemplate.service'
import { TimezoneUtil } from '../utils/timezone.util'
const loggerProvider = LoggerProvider.Instance

export class NotificationService {
  private static instance: NotificationService
  private readonly tokenRepository: MongoTokenRepository
  private readonly emailService: EmailService
  constructor() {
    this.tokenRepository = new MongoTokenRepository()
    this.emailService = new EmailService()
  }

  async getToken(verificationKey: string): Promise<ITokens> {
    try {
      return this.tokenRepository.getToken({ verificationKey }) as any
    } catch (error: any) {
      loggerProvider.logger.error('getToken_Error', {
        error: error.message,
        stack: error.stack,
        verificationKey,
      })
      throw error
    }
  }

  async setToken(expiry: number, verifyCode: string, verificationKey: string): Promise<void> {
    try {
      const otpExpires = TimezoneUtil.nowUTC()
      otpExpires.setMinutes(otpExpires.getMinutes() + expiry)

      const existingToken = await this.tokenRepository.getToken({ verificationKey })
      if (existingToken) {
        await this.tokenRepository.updateToken(
          { verificationKey },
          {
            verifyCode,
            otpExpires,
            updatedAt: TimezoneUtil.nowUTC(),
          },
        )
      } else {
        await this.tokenRepository.saveToken({
          verificationKey,
          verifyCode,
          otpExpires,
          createdAt: TimezoneUtil.nowUTC(),
          updatedAt: TimezoneUtil.nowUTC(),
        })
      }
    } catch (error: any) {
      loggerProvider.logger.error('setToken_Error', {
        error: error.message,
        stack: error.stack,
        verificationKey,
      })
      throw error
    }
  }


  async sendPasswordMail({ email, username, expiry = 30, type, adminEmail }: PasswordMailRequest): Promise<void> {
    try {
      const otp = envConfig.EMAIL_TEST_MODE ? envConfig.APP_TESTING_OTP : generateRandomOTP(constantConfig.OTP_LENGTH)

      if (!envConfig.EMAIL_TEST_MODE)
        await this.sendEmailTemplate(
          EmailTemplateService.Instance.getTemplateRequest(type)({ username, otp, email, adminEmail }),
        )

      await this.setToken(expiry, otp, email)
    } catch (error: any) {
      loggerProvider.logger.error('sendPasswordMail_Error', {
        error: error.message,
        stack: error.stack,
        email,
        username,
      })
      throw error
    }
  }

  async sendSetPasswordMail({
    email,
    username,
    expiry = 30,
  }: {
    email: string
    username: string
    expiry?: number
  }): Promise<void> {
    try {
      const otp = generateRandomOTP(constantConfig.OTP_LENGTH)

      const html = `<h1>Dear ${username}, your OTP for verification is ${otp}. Valid for 30 minutes.</h1>`

      if (!envConfig.EMAIL_TEST_MODE) await this.sendEmailTemplate({ email, html, subject: 'Reset Password Otp' })

      await this.setToken(expiry, otp, email)
    } catch (error: any) {
      loggerProvider.logger.error('sendSetPasswordMail_Error', {
        error: error.message,
        stack: error.stack,
        email,
        username,
      })
      throw error
    }
  }

  private async sendEmailTemplate({ email, html, subject }: EmailTemplateRequest): Promise<void> {
    try {
      const request: EmailRequest = {
        to: [email],
        subject,
        message: '',
        html,
      }
      await this.emailService.sendEmail(request)
    } catch (error: any) {
      loggerProvider.logger.error('sendEmailTemplate_Error', {
        error: error.message,
        stack: error.stack,
        email,
        subject,
      })
      throw error
    }
  }

  async sendEmailWithAttachment({ email, html, subject, attachments }: EmailWithAttachmentRequest): Promise<void> {
    try {
      await this.emailService.sendRawEmail({ email, html, subject, attachments })
    } catch (error: any) {
      loggerProvider.logger.error('sendEmailWithAttachment_Error', {
        error: error.message,
        stack: error.stack,
        email,
        subject,
      })
    }
  }

  public static get Instance() {
    if (isNil(this.instance)) this.instance = new this()

    return this.instance
  }
}
