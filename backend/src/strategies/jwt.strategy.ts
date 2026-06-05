import { Request } from 'express'
import { extractCredentials } from '../utils'
import { AuthenticationStrategy } from './authentication.strategies'
import { JWTService } from '../service/jwt.service'
import { UserProfile } from '../typings/interface'

export class JWTAuthenticationStrategy implements AuthenticationStrategy {
  private readonly jwtService: JWTService

  constructor() {
    this.jwtService = new JWTService()
  }

  async authenticate(request: Request): Promise<UserProfile> {
    const token: string = extractCredentials(request)
    const userProfile: UserProfile = this.jwtService.verifyToken(token) as UserProfile
    return Promise.resolve(userProfile)
  }
}
