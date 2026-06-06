import { sign, SignOptions, verify, VerifyOptions, Algorithm } from 'jsonwebtoken'
import { UserProfile } from '../typings/interface'
import { envConfig } from '../config'
import { isNil, unauthorized } from '../utils'
import { v4 as uuidv4 } from 'uuid'
export class JWTService {
  private static instance: JWTService
  public verifyToken(token: string, secretOrPublicKey?: string): UserProfile {
    try {
      const audienceArr = envConfig?.JWT_AUDIENCE.split(/\s|,/).filter(Boolean)
      const audience = audienceArr.length === 1 ? audienceArr[0] : (audienceArr as [string, ...string[]])
      const options: VerifyOptions = {
        issuer: envConfig.JWT_ISSUER,
        algorithms: [envConfig.JWT_ALGO as unknown as Algorithm],
        audience,
      }

      const { payload } = verify(token, secretOrPublicKey ?? envConfig.NETWORK_WEBHOOK_SECRET, options) as {
        payload: UserProfile
      }
      return payload
    } catch (error: any) {
      throw unauthorized('invalid login credentials')
    }
  }

  public generateToken(userProfile: UserProfile, secretOrPublicKey?: string, expiresIn?: number): string {
    try {
      const payload = userProfile
      const audience = envConfig?.JWT_AUDIENCE.split(/\s|,/)
      const signingOptions: SignOptions = {
        audience,
        expiresIn: expiresIn ?? envConfig.JWT_EXPIRES_IN,
        issuer: envConfig.JWT_ISSUER,
        algorithm: envConfig.JWT_ALGO,
        subject: userProfile.userId.toString() ?? userProfile.email,
        jwtid: uuidv4(),
      }
      const token = sign({ payload }, secretOrPublicKey ?? envConfig.NETWORK_WEBHOOK_SECRET, signingOptions)
      return token
    } catch (error: any) {
      throw error
    }
  }

  public static get Instance() {
    try {
      if (isNil(this.instance)) this.instance = new this()

      return this.instance
    } catch (error: any) {
      throw error
    }
  }
}
