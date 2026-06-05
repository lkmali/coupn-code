import { Request } from 'express'
import { extractCredentials } from '../utils'
import { AuthenticationStrategy } from './authentication.strategies'
import { JWTService } from '../service/jwt.service'
import { UserProfile } from '../typings/interface'
import { envConfig } from '../config'

export class AgentJWTAuthenticationStrategy implements AuthenticationStrategy {
  private readonly jwtService: JWTService

  constructor() {
    this.jwtService = new JWTService()
  }

  async authenticate(request: Request): Promise<UserProfile> {
    const token: string = extractCredentials(request)
    const userProfile: UserProfile = this.jwtService.verifyToken(token, envConfig.BOT_TOKEN_NETWORK) as UserProfile
    return Promise.resolve(userProfile)
  }
}
