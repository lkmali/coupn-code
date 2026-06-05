import { Request } from 'express'
import { get, isNil } from 'lodash'
import { MongoTokenRepository } from '@anantai/common'
import { UserService } from '../service'
import { UserProfile } from '../typings'
import { unauthorized } from '../utils'
import { LoggerProvider } from '../provider/logger.provider'
const loggerProvider = LoggerProvider.Instance
import { AuthenticationStrategy } from './authentication.strategies'

export class OtpAuthenticationStrategy implements AuthenticationStrategy {
  private readonly tokenRepository: MongoTokenRepository
  private readonly userService: UserService
  constructor() {
    this.tokenRepository = new MongoTokenRepository()
    this.userService = new UserService()
  }

  async authenticate(request: Request): Promise<UserProfile> {
    try {
      const credentials = get(request, 'body', {}) as {
        otp: string
        mobileNumber: string
      }
      const token = await this.tokenRepository.verifyOTP(credentials.mobileNumber, credentials.otp)
      if (isNil(token)) throw unauthorized('invalid otp')

      await this.tokenRepository.removeToken({ _id: token._id })
      const result = await this.userService.validateUserByPhoneNumber(credentials.mobileNumber)
      return result
    } catch (error: any) {
      loggerProvider.logger.error('Error during OTP authentication:', error)
      throw unauthorized('Authentication failed')
    }
  }
}
