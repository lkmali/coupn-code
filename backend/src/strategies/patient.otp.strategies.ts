import { Request } from 'express'
import { get, isNil } from 'lodash'
import { MongoTokenRepository } from '@anantai/common'
import { PatientAuthService } from '../service/patient'
import { PatientProfile, UserProfile } from '../typings'
import { unauthorized } from '../utils'
import { LoggerProvider } from '../provider/logger.provider'
import { AuthenticationStrategy } from './authentication.strategies'

const loggerProvider = LoggerProvider.Instance

export class PatientOtpAuthenticationStrategy implements AuthenticationStrategy {
  private readonly tokenRepository: MongoTokenRepository
  private readonly patientAuthService: PatientAuthService

  constructor() {
    this.tokenRepository = new MongoTokenRepository()
    this.patientAuthService = PatientAuthService.Instance
  }

  async authenticate(request: Request): Promise<UserProfile> {
    try {
      const credentials = get(request, 'body', {}) as {
        otp: string
        mobileNumber: string
        orgId: string
      }
      if (!credentials.orgId) throw unauthorized('orgId is required')

      const token = await this.tokenRepository.verifyOTP(credentials.mobileNumber, credentials.otp)
      if (isNil(token)) throw unauthorized('invalid otp')

      await this.tokenRepository.removeToken({ _id: token._id })
      const patientProfile: PatientProfile = await this.patientAuthService.buildPatientProfile(
        credentials.mobileNumber,
        credentials.orgId,
      )
      return patientProfile as unknown as UserProfile
    } catch (error: any) {
      loggerProvider.logger.error('PatientOtpAuthenticationStrategy_Error', { error: error.message, stack: error.stack })
      throw unauthorized('Authentication failed')
    }
  }
}
