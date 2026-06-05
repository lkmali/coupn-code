import { Request } from 'express'
import { extractCredentials } from '../utils'
import { AuthenticationStrategy } from './authentication.strategies'
import { JWTService } from '../service/jwt.service'
import { PatientProfile, UserProfile } from '../typings/interface'
import { envConfig } from '../config'

export class PatientJWTAuthenticationStrategy implements AuthenticationStrategy {
  private readonly jwtService: JWTService

  constructor() {
    this.jwtService = new JWTService()
  }

  async authenticate(request: Request): Promise<UserProfile> {
    const token: string = extractCredentials(request)
    const patientProfile = this.jwtService.verifyToken(token, envConfig.PATIENT_JWT_SECRET) as unknown as PatientProfile
    return Promise.resolve(patientProfile as unknown as UserProfile)
  }
}
