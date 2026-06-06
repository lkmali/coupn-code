import { Request } from 'express'
import { isEmpty, isNil, unauthorized } from '../utils'
import { AuthenticationStrategy } from './authentication.strategies'
import { UserService } from '../service/user.service'
import { UserCredentials, UserProfile } from '../typings'

export class BasicAuthenticationStrategy implements AuthenticationStrategy {
  private readonly userService: UserService
  constructor() {
    this.userService = new UserService()
  }

  async authenticate(request: Request): Promise<UserProfile> {
    const credentials: UserCredentials = this.extractCredentials(request)
    const userProfile = await this.userService.verifyCredentials(credentials)
    return userProfile
  }

  extractCredentials(request: Request): UserCredentials {
    const { authorization } = request.headers
    if (isNil(authorization) || isEmpty(authorization)) throw unauthorized('Authorization header not found.')
    const basicAuthPresent = /^Basic\s(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(
      String(authorization),
    )
    if (!basicAuthPresent) throw unauthorized('Please supply a valid basic auth header.')
    const auth = this.createCredentials(authorization as string)
    if (isEmpty(auth.email)) throw unauthorized('Please supply your email.')
    if (isEmpty(auth.password)) throw unauthorized('Please supply your password.')
    return auth
  }

  createCredentials(authorization: string): UserCredentials {
    const base64Credentials = Buffer.from(String(authorization).split(' ')[1], 'base64').toString('ascii')
    const [email, password]: string[] = base64Credentials.split(':')
    return { email, password }
  }
}
