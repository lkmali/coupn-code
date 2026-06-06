/**
 * Redis service abstraction for common package.
 * Express app should call setRedisService() at startup to inject the real Redis instance.
 */

export interface IRedisService {
  exists(key: string): Promise<boolean>
  set(key: string, value: string): Promise<void>
  incr(key: string): Promise<number>
  acquireLock(key: string, ttl: number, retries: number, delay: number): Promise<boolean>
  releaseLock(key: string): Promise<void>
}

let redisService: IRedisService | null = null

export function getRedisService(): IRedisService {
  if (!redisService) {
    throw new Error('RedisService not initialized. Call setRedisService()  first.  ')
  }
  return redisService
}

export function setRedisService(service: IRedisService): void {
  redisService = service
}
