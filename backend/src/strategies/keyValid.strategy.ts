import { Request } from 'express'
import crypto from 'crypto'
import { AuthenticationStrategy } from './authentication.strategies'
import { unauthorized } from '../utils'
import { UserProfile } from '../typings/interface'
import { envConfig } from '../config'
import { ClientKeyService, RedisService } from '../service'

const CLIENT_CACHE_PREFIX = 'client-key:'
const CLIENT_CACHE_TTL_SECONDS = 900

export class KeyValidAuthenticationStrategy implements AuthenticationStrategy {
  async authenticate(request: Request): Promise<UserProfile> {
    const accessKeyId = request.headers['x-access-key-id'] as string
    const secretAccessKey = request.headers['x-secret-access-key'] as string
    const clientKey = request.headers['x-client-key'] as string
    const clientSecret = request.headers['x-client-secret'] as string

    if (clientKey && clientSecret) {
      return this.authenticateClientCredentials(clientKey, clientSecret)
    }

    return this.authenticateLambda(accessKeyId, secretAccessKey)
  }

  private async authenticateClientCredentials(clientKey: string, clientSecret: string): Promise<UserProfile> {
    const cacheKey = `${CLIENT_CACHE_PREFIX}${clientKey}`
    try {
      const cached = await RedisService.Instance.hgetall(cacheKey)
      if (cached && Object.keys(cached).length > 0 && cached.clientSecret === clientSecret) {
        return {
          userId: cached.userId || null,
          roles: cached.roles ? JSON.parse(cached.roles) : [],
          orgId: cached.orgId || null,
          sessionId: cached.sessionId || null,
          isActive: true,
        } as UserProfile
      }
    } catch (error) {
      // Redis may be unavailable. Fallback to database lookup.
      console.warn('[KeyValidAuthenticationStrategy] Redis is unavailable for client key cache.', error)
    }

    const profile = await ClientKeyService.Instance.getClientData(clientKey, clientSecret)

    try {
      await RedisService.Instance.hset(cacheKey, 'clientSecret', clientSecret)
      await RedisService.Instance.hset(cacheKey, 'userId', String(profile.userId ?? ''))
      await RedisService.Instance.hset(cacheKey, 'orgId', String(profile.orgId ?? ''))
      await RedisService.Instance.hset(cacheKey, 'roles', JSON.stringify(profile.roles ?? []))
      if (profile.sessionId) {
        await RedisService.Instance.hset(cacheKey, 'sessionId', profile.sessionId)
      }
      await RedisService.Instance.expire(cacheKey, CLIENT_CACHE_TTL_SECONDS)
    } catch (error) {
      console.warn('[KeyValidAuthenticationStrategy] Unable to cache client credentials in Redis.', error)
    }

    return profile
  }

  private async authenticateLambda(accessKeyId: string, secretAccessKey: string): Promise<UserProfile> {
    console.log('[KeyValidAuthenticationStrategy] Received authentication attempt with Access Key ID:', accessKeyId)
    console.log('[KeyValidAuthenticationStrategy] Received authentication attempt with secretAccessKey Key ID:', secretAccessKey)
    console.log('[KeyValidAuthenticationStrategy] Expected Access Key ID:', envConfig.LAMBDA_ACCESS_KEY_ID)

    const expectedKey = envConfig.LAMBDA_ACCESS_KEY_ID
    const expectedSecret = envConfig.LAMBDA_SECRET_ACCESS_KEY

    if (
      !accessKeyId || !secretAccessKey || !expectedKey || !expectedSecret ||
      accessKeyId.length !== expectedKey.length ||
      secretAccessKey.length !== expectedSecret.length ||
      !crypto.timingSafeEqual(Buffer.from(accessKeyId), Buffer.from(expectedKey)) ||
      !crypto.timingSafeEqual(Buffer.from(secretAccessKey), Buffer.from(expectedSecret))
    ) {
      throw unauthorized('Invalid or missing Lambda credentials')
    }

    return {
      userId: null,
      roles: [],
      orgId: null,
      sessionId: null,
      isActive: true,
    } as UserProfile
  }
}
