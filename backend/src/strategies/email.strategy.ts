import { Request } from 'express'
import { get, isNil } from 'lodash'
import { MongoTokenRepository } from '@anantai/common'
import { UserService, EncryptionService } from '../service'
import { UserProfile } from '../typings'
import { unauthorized } from '../utils'
import { AuthenticationStrategy } from './authentication.strategies'

export class EmailAuthenticationStrategy implements AuthenticationStrategy {
  private readonly tokenRepository: MongoTokenRepository
  private readonly userService: UserService
  constructor() {
    this.tokenRepository = new MongoTokenRepository()
    this.userService = new UserService()
  }

  async authenticate(request: Request): Promise<UserProfile> {
    const credentials = get(request, 'body', {}) as { otp: string; email: string }
    credentials.otp = EncryptionService.Instance.decrypt(credentials.otp, unauthorized('invalid otp'))
    if (isNil(credentials.email) || isNil(credentials.otp)) throw unauthorized('missing information')

    const token = await this.tokenRepository.verifyOTP(credentials.email, credentials.otp)
    if (isNil(token)) throw unauthorized('invalid otp')

    //await this.tokenRepository.removeToken({ _id: token._id })
    return this.userService.prepareUserProfileData(credentials.email)
  }
}
