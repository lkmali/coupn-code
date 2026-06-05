import Redis, { Cluster, RedisOptions, ClusterOptions } from 'ioredis'
import { LoggerProvider } from '../provider/logger.provider'
import { formatRedisData, isNil } from '../utils'
import { envConfig, redisConfig } from '../config'

const loggerProvider = LoggerProvider.Instance

/**
 * RedisService - Singleton service for Redis connection management
 * Supports both normal Redis client and Redis Cluster based on environment configuration
 */
export class RedisService {
  private static instance: RedisService
  private redisClient: Redis | Cluster | null = null
  private isClusterMode: boolean = false
  private readonly logger = loggerProvider.logger
  private readonly keyPrefix: string

  private constructor() {
    // Set key prefix based on environment
    this.keyPrefix = `anantai-${envConfig.redisPriFix}-`

    if (redisConfig.useRedis) {
      this.initializeRedis()
    }
  }

  /**
   * Build a Redis key with the environment prefix
   */
  private buildKey(key: string): string {
    return `${this.keyPrefix}${key}`
  }

  /**
   * Initialize Redis connection based on configuration
   */
  private initializeRedis(): void {
    try {
      this.isClusterMode = redisConfig.useCluster

      if (redisConfig.useCluster && redisConfig.clusterNodes) {
        // Initialize Redis Cluster
        const clusterNodes = redisConfig.clusterNodes.split(',').map(node => {
          const [host, port] = node.trim().split(':')
          return { host, port: parseInt(port, 10) }
        })

        const clusterOptions: ClusterOptions = {
          dnsLookup: (address, callback) => callback(null, address),
          redisOptions: {
            password: redisConfig.password,
            maxRetriesPerRequest: null, // Required for BullMQ
            enableReadyCheck: false,
            tls: {},
          },
          clusterRetryStrategy: (times: number) => {
            // Limit retry attempts to 10 times
            if (times > 10) {
              this.logger.error(`Redis Cluster retry limit reached after ${times} attempts`)
              return null // Stop retrying
            }
            const delay = Math.min(times * 50, 2000)
            return delay
          },
        }

        this.redisClient = new Redis.Cluster(clusterNodes, clusterOptions)
      } else {
        // Initialize normal Redis client
        const redisOptions: RedisOptions = {
          host: redisConfig.host,
          port: redisConfig.port,
          username: redisConfig.username,
          password: redisConfig.password,
          db: redisConfig.db,
          maxRetriesPerRequest: null, // Required for BullMQ
          enableReadyCheck: false,
          retryStrategy: (times: number) => {
            // Limit retry attempts to 10 times
            if (times > 10) {
              this.logger.error(`Redis retry limit reached after ${times} attempts`)
              return null // Stop retrying
            }
            const delay = Math.min(times * 50, 2000)
            return delay
          },
        }

        this.redisClient = new Redis(redisOptions)
      }

      // Setup event listeners
      this.setupEventListeners()
    } catch (error: any) {
      this.logger.error('Failed to initialize Redis', error)
      throw error
    }
  }

  /**
   * Setup Redis event listeners for monitoring
   */
  private setupEventListeners(): void {
    try {
      if (!this.redisClient) return

      this.redisClient.on('error', error => {
        this.logger.error(`Redis ${this.isClusterMode ? 'Cluster' : 'Client'} error`, error)
      })
    } catch (error: any) {
      loggerProvider.logger.error('setupEventListeners_Error', { error: error.message, stack: error.stack })
      throw error
    }
  }

  /**
   * Get the Redis client instance
   */
  public getClient(): Redis | Cluster {
    try {
      if (!this.redisClient) {
        throw new Error('Redis client is not initialized')
      }
      return this.redisClient
    } catch (error: any) {
      loggerProvider.logger.error('getClient_Error', { error: error.message, stack: error.stack })
      throw error
    }
  }

  /**
   * Check if Redis is in cluster mode
   */
  public isCluster(): boolean {
    try {
      return this.isClusterMode
    } catch (error: any) {
      loggerProvider.logger.error('isCluster_Error', { error: error.message, stack: error.stack })
      throw error
    }
  }

  /**
   * Ping Redis to check connection
   */
  public async ping(): Promise<string> {
    try {
      const response = await this.redisClient?.ping()
      return response || 'PONG'
    } catch (error: any) {
      this.logger.error('Redis ping failed:', error)
      throw error
    }
  }

  /**
   * Set a key-value pair in Redis
   */
  public async set(key: string, value: string, expirySeconds?: number): Promise<'OK' | null> {
    try {
      const prefixedKey = this.buildKey(key)
      if (expirySeconds) {
        return (await this.redisClient?.setex(prefixedKey, expirySeconds, value)) || null
      }
      return (await this.redisClient?.set(prefixedKey, value)) || null
    } catch (error: any) {
      this.logger.error(`Redis SET failed for key: ${key}`, error)
      throw error
    }
  }

  /**
   * Get a value from Redis by key
   */
  public async get(key: string): Promise<string | any | null> {
    try {
      if (!redisConfig.useRedis) {
        return null
      }
      const prefixedKey = this.buildKey(key)
      return formatRedisData(await this.redisClient?.get(prefixedKey))
    } catch (error: any) {
      this.logger.error(`Redis GET failed for key: ${key}`, error)
      throw error
    }
  }

  /**
   * Delete a key from Redis
   */
  public async del(key: string): Promise<number> {
    try {
      const prefixedKey = this.buildKey(key)
      return (await this.redisClient?.del(prefixedKey)) || 0
    } catch (error: any) {
      this.logger.error(`Redis DEL failed for key: ${key}`, error)
      throw error
    }
  }

  /**
   * Check if a key exists in Redis
   */
  public async exists(key: string): Promise<boolean> {
    try {
      const prefixedKey = this.buildKey(key)
      const result = await this.redisClient?.exists(prefixedKey)
      return result === 1
    } catch (error: any) {
      this.logger.error(`Redis EXISTS failed for key: ${key}`, error)
      throw error
    }
  }

  /**
   * Set expiry time for a key
   */
  public async expire(key: string, seconds: number): Promise<boolean> {
    try {
      const prefixedKey = this.buildKey(key)
      const result = await this.redisClient?.expire(prefixedKey, seconds)
      return result === 1
    } catch (error: any) {
      this.logger.error(`Redis EXPIRE failed for key: ${key}`, error)
      throw error
    }
  }

  /**
   * Get TTL (time to live) for a key
   */
  public async ttl(key: string): Promise<number> {
    try {
      const prefixedKey = this.buildKey(key)
      return (await this.redisClient?.ttl(prefixedKey)) || -2
    } catch (error: any) {
      this.logger.error(`Redis TTL failed for key: ${key}`, error)
      throw error
    }
  }

  /**
   * Increment a counter
   */
  public async incr(key: string): Promise<number> {
    try {
      const prefixedKey = this.buildKey(key)
      return (await this.redisClient?.incr(prefixedKey)) || 0
    } catch (error: any) {
      this.logger.error(`Redis INCR failed for key: ${key}`, error)
      throw error
    }
  }

  /**
   * Decrement a counter
   */
  public async decr(key: string): Promise<number> {
    try {
      const prefixedKey = this.buildKey(key)
      return (await this.redisClient?.decr(prefixedKey)) || 0
    } catch (error: any) {
      this.logger.error(`Redis DECR failed for key: ${key}`, error)
      throw error
    }
  }

  /**
   * Set hash field
   */
  public async hset(key: string, field: string, value: string): Promise<number> {
    try {
      const prefixedKey = this.buildKey(key)
      return (await this.redisClient?.hset(prefixedKey, field, value)) || 0
    } catch (error: any) {
      this.logger.error(`Redis HSET failed for key: ${key}, field: ${field}`, error)
      throw error
    }
  }

  /**
   * Get hash field
   */
  public async hget(key: string, field: string): Promise<string | null> {
    try {
      const prefixedKey = this.buildKey(key)
      return (await this.redisClient?.hget(prefixedKey, field)) || null
    } catch (error: any) {
      this.logger.error(`Redis HGET failed for key: ${key}, field: ${field}`, error)
      throw error
    }
  }

  /**
   * Get all hash fields
   */
  public async hgetall(key: string): Promise<Record<string, string>> {
    try {
      const prefixedKey = this.buildKey(key)
      return (await this.redisClient?.hgetall(prefixedKey)) || {}
    } catch (error: any) {
      this.logger.error(`Redis HGETALL failed for key: ${key}`, error)
      throw error
    }
  }

  /**
   * Delete hash field
   */
  public async hdel(key: string, field: string): Promise<number> {
    try {
      const prefixedKey = this.buildKey(key)
      return (await this.redisClient?.hdel(prefixedKey, field)) || 0
    } catch (error: any) {
      this.logger.error(`Redis HDEL failed for key: ${key}, field: ${field}`, error)
      throw error
    }
  }

  /**
   * Add to a set
   */
  public async sadd(key: string, ...members: string[]): Promise<number> {
    try {
      const prefixedKey = this.buildKey(key)
      return (await this.redisClient?.sadd(prefixedKey, ...members)) || 0
    } catch (error: any) {
      this.logger.error(`Redis SADD failed for key: ${key}`, error)
      throw error
    }
  }

  /**
   * Remove from a set
   */
  public async srem(key: string, ...members: string[]): Promise<number> {
    try {
      const prefixedKey = this.buildKey(key)
      return (await this.redisClient?.srem(prefixedKey, ...members)) || 0
    } catch (error: any) {
      this.logger.error(`Redis SREM failed for key: ${key}`, error)
      throw error
    }
  }

  /**
   * Get all members of a set
   */
  public async smembers(key: string): Promise<string[]> {
    try {
      const prefixedKey = this.buildKey(key)
      return (await this.redisClient?.smembers(prefixedKey)) || []
    } catch (error: any) {
      this.logger.error(`Redis SMEMBERS failed for key: ${key}`, error)
      throw error
    }
  }

  /**
   * Check if member exists in set
   */
  public async sismember(key: string, member: string): Promise<boolean> {
    try {
      const prefixedKey = this.buildKey(key)
      const result = await this.redisClient?.sismember(prefixedKey, member)
      return result === 1
    } catch (error: any) {
      this.logger.error(`Redis SISMEMBER failed for key: ${key}`, error)
      throw error
    }
  }

  /**
   * Publish a message to a channel (Pub/Sub)
   */
  public async publish(channel: string, message: string): Promise<number> {
    try {
      const prefixedChannel = this.buildKey(channel)
      return (await this.redisClient?.publish(prefixedChannel, message)) || 0
    } catch (error: any) {
      this.logger.error(`Redis PUBLISH failed for channel: ${channel}`, error)
      throw error
    }
  }

  /**
   * Subscribe to a channel (Pub/Sub)
   * Returns a new Redis connection for subscribing
   */
  public async subscribe(channel: string, callback: (message: string) => void): Promise<Redis> {
    try {
      // Create a new connection for subscribing (required by Redis)
      const subscriber = this.createSubscriberClient()
      const prefixedChannel = this.buildKey(channel)

      subscriber.subscribe(prefixedChannel, err => {
        if (err) {
          this.logger.error(`Failed to subscribe to channel: ${channel}`, err)
        }
      })

      subscriber.on('message', (ch, msg) => {
        if (ch === prefixedChannel) {
          callback(msg)
        }
      })

      return subscriber
    } catch (error: any) {
      this.logger.error(`Redis SUBSCRIBE failed for channel: ${channel}`, error)
      throw error
    }
  }

  /**
   * Create a new Redis client for subscribing (Pub/Sub requires separate connection)
   */
  private createSubscriberClient(): Redis {
    try {
      const redisOptions: RedisOptions = {
        host: redisConfig.host,
        port: redisConfig.port,
        password: redisConfig.password,
        db: redisConfig.db,
        retryStrategy: (times: number) => {
          // Limit retry attempts to 10 times
          if (times > 10) {
            this.logger.error(`Redis subscriber retry limit reached after ${times} attempts`)
            return null // Stop retrying
          }
          const delay = Math.min(times * 50, 2000)
          return delay
        },
      }

      return new Redis(redisOptions)
    } catch (error: any) {
      loggerProvider.logger.error('createSubscriberClient_Error', { error: error.message, stack: error.stack })
      throw error
    }
  }

  /**
   * Acquire a distributed lock using Redis (SETNX with TTL)
   * This is used for ensuring sequential processing per user
   *
   * @param lockKey - The key to lock on (e.g., "lock:user:123")
   * @param ttl - Time to live in seconds (default: 30 seconds)
   * @param retries - Number of retries (default: 0, no retries)
   * @param retryDelay - Delay between retries in milliseconds (default: 100ms)
   * @returns true if lock acquired, false otherwise
   */
  public async acquireLock(
    lockKey: string,
    ttl: number = 30,
    retries: number = 0,
    retryDelay: number = 100,
  ): Promise<boolean> {
    try {
      const prefixedKey = this.buildKey(lockKey)
      let attempts = 0
      while (attempts <= retries) {
        // Use SET with NX (only set if not exists) and EX (expiry in seconds)
        const result = await this.redisClient?.set(prefixedKey, '1', 'EX', ttl, 'NX')

        if (result === 'OK') {
          return true
        }

        if (attempts < retries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay))
        }
        attempts++
      }

      return false
    } catch (error: any) {
      this.logger.error(`Redis ACQUIRE_LOCK failed for key: ${lockKey}`, error)
      throw error
    }
  }

  /**
   * Release a distributed lock
   *
   * @param lockKey - The key to release
   * @returns true if lock released, false if lock didn't exist
   */
  public async releaseLock(lockKey: string): Promise<boolean> {
    try {
      const result = await this.del(lockKey)
      return result === 1
    } catch (error: any) {
      this.logger.error(`Redis RELEASE_LOCK failed for key: ${lockKey}`, error)
      throw error
    }
  }

  /**
   * Check if a lock is currently held
   *
   * @param lockKey - The key to check
   * @returns true if lock exists, false otherwise
   */
  public async isLocked(lockKey: string): Promise<boolean> {
    try {
      return await this.exists(lockKey)
    } catch (error: any) {
      this.logger.error(`Redis IS_LOCKED check failed for key: ${lockKey}`, error)
      throw error
    }
  }

  /**
   * Execute a function with a distributed lock
   * Automatically acquires lock, executes function, and releases lock
   *
   * @param lockKey - The key to lock on
   * @param fn - The function to execute while holding the lock
   * @param ttl - Lock TTL in seconds (default: 30)
   * @returns Result of the function execution
   */
  public async withLock<T>(lockKey: string, fn: () => Promise<T>, ttl: number = 30): Promise<T> {
    try {
      const lockAcquired = await this.acquireLock(lockKey, ttl)

      if (!lockAcquired) {
        throw new Error(`Failed to acquire lock: ${lockKey}`)
      }

      try {
        return await fn()
      } finally {
        await this.releaseLock(lockKey)
      }
    } catch (error: any) {
      loggerProvider.logger.error('withLock_Error', { error: error.message, stack: error.stack, lockKey })
      throw error
    }
  }

  /**
   * Acquire lock with instant notification when lock becomes available
   * Uses Redis Pub/Sub to notify waiting processes immediately when lock is released
   * This eliminates retry delays - next job starts processing within milliseconds
   *
   * @param lockKey - The key to lock on
   * @param ttl - Lock TTL in seconds (default: 120)
   * @param maxWaitTime - Maximum time to wait in milliseconds (default: 60000ms = 60s)
   * @returns true if lock acquired, false otherwise
   */
  public async acquireLockWithNotification(
    lockKey: string,
    ttl: number = 120,
    maxWaitTime: number = 60000,
  ): Promise<boolean> {
    try {
      // Try to acquire lock immediately
      const immediate = await this.acquireLock(lockKey, ttl, 0, 0)
      if (immediate) {
        return true
      }

      // If lock not available, subscribe to release notifications
      const channelName = `lock:release:${lockKey}`
      const prefixedChannelName = this.buildKey(channelName)
      const subscriber = this.createSubscriberClient()

      return new Promise<boolean>((resolve, reject) => {
        let resolved = false
        let timeoutHandle: NodeJS.Timeout | null = null

        const cleanup = () => {
          if (timeoutHandle) clearTimeout(timeoutHandle)
          subscriber.removeAllListeners('message')
          subscriber.unsubscribe(prefixedChannelName).catch(() => {})
          subscriber.quit().catch(() => {})
        }

        // Set timeout for max wait time
        timeoutHandle = setTimeout(() => {
          if (!resolved) {
            resolved = true
            cleanup()
            resolve(false)
          }
        }, maxWaitTime)

        // Subscribe to lock release notifications
        subscriber.subscribe(prefixedChannelName, async err => {
          if (err) {
            if (!resolved) {
              resolved = true
              cleanup()
              reject(err)
            }
            return
          }

          // Immediately try to acquire lock when subscribed
          try {
            const acquired = await this.acquireLock(lockKey, ttl, 0, 0)
            if (acquired && !resolved) {
              resolved = true
              cleanup()
              resolve(true)
            }
          } catch (e) {
            if (!resolved) {
              resolved = true
              cleanup()
              reject(e)
            }
          }
        })

        // Listen for release notifications
        subscriber.on('message', async (channel, message) => {
          if (channel === prefixedChannelName && message === 'released' && !resolved) {
            try {
              const acquired = await this.acquireLock(lockKey, ttl, 0, 0)
              if (acquired) {
                resolved = true
                cleanup()
                resolve(true)
              }
            } catch (e) {
              if (!resolved) {
                resolved = true
                cleanup()
                reject(e)
              }
            }
          }
        })

        // Handle subscriber errors
        subscriber.on('error', (err) => {
          if (!resolved) {
            resolved = true
            cleanup()
            reject(err)
          }
        })
      })
    } catch (error: any) {
      loggerProvider.logger.error('acquireLockWithNotification_Error', {
        error: error.message,
        stack: error.stack,
        lockKey,
      })
      throw error
    }
  }

  /**
   * Release lock and notify all waiting processes via Pub/Sub
   * This allows instant processing of next job with zero delay
   *
   * @param lockKey - The key to release
   * @returns true if lock released, false if lock didn't exist
   */
  public async releaseLockWithNotification(lockKey: string): Promise<boolean> {
    try {
      const released = await this.releaseLock(lockKey)

      if (released) {
        // Publish notification to all waiting processes
        const channelName = `lock:release:${lockKey}`
        await this.publish(channelName, 'released')
      }

      return released
    } catch (error: any) {
      loggerProvider.logger.error('releaseLockWithNotification_Error', {
        error: error.message,
        stack: error.stack,
        lockKey,
      })
      throw error
    }
  }

  /**
   * Gracefully close Redis connection
   */
  public async close(): Promise<void> {
    try {
      await this.redisClient?.quit()
    } catch (error: any) {
      this.logger.error('Error closing Redis connection', error)
      throw error
    }
  }

  /**
   * Get singleton instance
   */
  public static get Instance(): RedisService {
    try {
      if (isNil(this.instance)) {
        this.instance = new this()
      }
      return this.instance
    } catch (error: any) {
      loggerProvider.logger.error('Instance_Error', { error: error.message, stack: error.stack })
      throw error
    }
  }
}
