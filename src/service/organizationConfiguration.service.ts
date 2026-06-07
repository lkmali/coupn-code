import {
  IWhatsAppTemplate,
  IWhatsAppTemplateDocuments,
  IOrganizationConfiguration,
  UserProfile
} from '../typings'
import { badRequest, isNil } from '../utils'
import {
  MongoOrganizationConfigurationRepository,
  toObjectId,
} from '../database'
import { LoggerProvider } from '../provider/logger.provider'
import {
  CreateOrganizationConfigurationDto
} from '../dto'
import { RedisService } from './redis.service'
import { EXOTEL_WEBHOOK_TOKEN_REDIS_KEY } from './exotel.service'
import { TimezoneUtil } from '../utils/timezone.util'
import { omit } from 'lodash'
import { randomBytes } from 'crypto'
import {
  encryptConfigSecrets,
  decryptConfigSecrets,
  preserveUnchangedSecrets,
} from '../utils/configSecrets'
// import { WhatsAppChatService } from './meta/whatsAppChat'

const loggerProvider = LoggerProvider.Instance

export class OrganizationConfigurationService {
  private readonly redisService: RedisService
  //   private readonly whatsAppChatService: WhatsAppChatService
  private static instance: OrganizationConfigurationService
  private readonly organizationConfigurationRepository: MongoOrganizationConfigurationRepository

  private readonly CACHE_TTL = 3600 // 1 hour in seconds
  private readonly CACHE_KEY_PREFIX = 'org_config:'

  /**
   * Process-local L1 cache holding the *decrypted, real* configuration per org.
   * Warmed on startup ({@link warmupConfigCache}) and refreshed on every save so
   * internal callers (copilot, Meta/WhatsApp senders) read real secret values
   * without a DB/Redis round-trip. Client responses are masked separately.
   */
  private readonly memoryConfigCache = new Map<string, IOrganizationConfiguration>()

  constructor() {
    this.organizationConfigurationRepository = new MongoOrganizationConfigurationRepository()
    this.redisService = RedisService.Instance
    // this.whatsAppChatService = WhatsAppChatService.Instance
  }

  /**
   * Generate Redis cache key for organization configuration
   */
  private getOrganizationCacheKey(orgId: string | number): string {
    try {
      return `${this.CACHE_KEY_PREFIX}_organization_by_id${orgId}`
    } catch (error: any) {
      loggerProvider.logger.error('getCacheKey_Error', { error: error.message, stack: error.stack, orgId })
      throw error
    }
  }

  /**
   * Generate Redis cache key for organization configuration
   */
  private getCacheKeyByPhoneNumber(phoneNumberId: string): string {
    try {
      return `${this.CACHE_KEY_PREFIX}_organization_by_phone_${phoneNumberId}`
    } catch (error: any) {
      loggerProvider.logger.error('getCacheKeyByPhoneNumber_Error', {
        error: error.message,
        stack: error.stack,
        phoneNumberId,
      })
      throw error
    }
  }

  /**
   * Create a new organization configuration
   */
  async createOrganizationConfiguration(
    data: CreateOrganizationConfigurationDto,
    userProfile: UserProfile,
  ): Promise<{ message: string }> {
    try {
      // Check if configuration already exists for this organization
      const existingConfig = await this.organizationConfigurationRepository.getOrganizationConfiguration({
        orgId: toObjectId(userProfile.orgId),
        isDelete: false,
      })
      // Validate working hours structure
      // Prepare data for saving
      const configData: any = {
        ...omit(data, ['welcomeMessage', 'testimonialMessage', 'appointmentInformation', 'whatsappTemplate']),
        orgId: toObjectId(userProfile.orgId),
        createdBy: toObjectId(userProfile.userId),
        updatedBy: toObjectId(userProfile.userId),
        createdAt: TimezoneUtil.nowUTC(),
        updatedAt: TimezoneUtil.nowUTC(),
        isActive: true,
        isDelete: false,
        phoneNumbersId: (() => {
          const info = data?.phoneNumberInformation || existingConfig?.phoneNumberInformation || []
          return info
            .filter((item: any) => item?.isEnabled === true)
            .map((item: any) => item?.phoneNumber)
            .filter(Boolean)
        })(),
        phoneNumberInformation: data?.phoneNumberInformation || existingConfig?.phoneNumberInformation || [],
      }

  

      // whatsappTemplate - language-agnostic, keyed by template type
      if (Array.isArray(data.whatsappTemplate) && data.whatsappTemplate.length > 0) {
        configData.whatsappTemplate = data.whatsappTemplate.reduce(
          (acc, template) => {
            acc[template.type] = {
              id: template.id,
              type: template.type,
              languageCode: template.languageCode,
              isEnabled: template.isEnabled,
              needToShowOnUI: template.needToShowOnUI ?? true,
              imageUrl: template.imageUrl,
              documents: template.documents as IWhatsAppTemplateDocuments,
              ...(template.templateTitle ? { templateTitle: template.templateTitle } : {}),
              messageBody: template.messageBody,
              ...(template.buttons ? { buttons: template.buttons } : { buttons: [] }),
              ...(template.templateParameters ? { templateParameters: template.templateParameters } : {}),
              ...(Array.isArray(template.components) && template.components.length > 0
                ? { components: template.components }
                : {}),
            }
            return acc
          },
          {} as Record<string, IWhatsAppTemplate>,
        )
      }

      // Cache each phoneNumberId -> orgId mapping in Redis
      if (Array.isArray(configData.phoneNumbersId) && configData.phoneNumbersId.length > 0) {
        // Invalidate old phone number caches if existing config had different numbers
        if (existingConfig?.phoneNumbersId && Array.isArray(existingConfig.phoneNumbersId)) {
          for (const oldPhoneId of existingConfig.phoneNumbersId) {
            if (!configData.phoneNumbersId.includes(oldPhoneId)) {
              const oldCacheKey = this.getCacheKeyByPhoneNumber(oldPhoneId)
              await this.redisService.del(oldCacheKey)
              loggerProvider.logger.info(`Cache invalidated for removed phoneNumberId: ${oldPhoneId}`)
            }
          }
        }
        for (const phoneId of configData.phoneNumbersId) {
          const cacheKeyByPhone = this.getCacheKeyByPhoneNumber(phoneId)
          await this.redisService.del(cacheKeyByPhone)
          await this.redisService.set(
            cacheKeyByPhone,
            JSON.stringify({
              orgId: userProfile.orgId,
            }),
            this.CACHE_TTL,
          )
          loggerProvider.logger.info(`Cache set for phoneNumberId: ${phoneId}`)
        }
      }

      // Exotel webhookToken: auto-generate one if the org enabled Exotel
      // without supplying a token, then invalidate any stale Redis cache
      // for the previous token so the inbound-call webhook resolver picks
      // up the new value on its next miss.
      const previousExotelToken: string | undefined =
        existingConfig?.exotelConfiguration?.webhookToken
      if (configData.exotelConfiguration) {
        if (!configData.exotelConfiguration.webhookToken) {
          configData.exotelConfiguration.webhookToken = randomBytes(24).toString('hex')
        }
        const newToken: string = configData.exotelConfiguration.webhookToken
        try {
          if (previousExotelToken && previousExotelToken !== newToken) {
            await this.redisService.del(EXOTEL_WEBHOOK_TOKEN_REDIS_KEY(previousExotelToken))
          }
          await this.redisService.del(EXOTEL_WEBHOOK_TOKEN_REDIS_KEY(newToken))
        } catch (redisError) {
          loggerProvider.logger.warn('Redis delete error for exotel webhookToken cache:', redisError)
        }
      } else if (previousExotelToken) {
        try {
          await this.redisService.del(EXOTEL_WEBHOOK_TOKEN_REDIS_KEY(previousExotelToken))
        } catch (redisError) {
          loggerProvider.logger.warn('Redis delete error for exotel webhookToken cache:', redisError)
        }
      }

      // Secret handling: keep previously stored secrets when the client sent a
      // blank/masked value (no re-entry), then encrypt at-rest secret fields
      // before persisting. Done last so it covers every branch above.
      preserveUnchangedSecrets(configData, existingConfig as object | null)
      const encryptedConfigData = encryptConfigSecrets(configData)

      if (existingConfig) {
        const { orgId: _omitOrgId, createdAt: _omitCreatedAt, createdBy: _omitCreatedBy, ...updateBody } = encryptedConfigData
        await this.organizationConfigurationRepository.updateOrganizationConfiguration(
          { _id: toObjectId((existingConfig as any)._id) },
          {
            ...updateBody,
            adminUserId: userProfile.userId,
          },
        )
      } else {
        await this.organizationConfigurationRepository.saveOrganizationConfiguration(
          {
            ...encryptedConfigData,
            adminUserId: userProfile.userId,
            testimonialMessage: encryptedConfigData?.testimonialMessage ?? {},
            welcomeMessage: encryptedConfigData?.welcomeMessage ?? {},
            whatsappTemplate: encryptedConfigData?.whatsappTemplate ?? {},
          },
          {},
        )
      }

      // Invalidate Redis cache and refresh the in-memory L1 with the real
      // (decrypted) config so internal callers see the new values immediately.
      try {
        const cacheKey = this.getOrganizationCacheKey(userProfile.orgId)
        await this.redisService.del(cacheKey)
        loggerProvider.logger.info(`Cache invalidated for orgId: ${userProfile.orgId}`)
      } catch (redisError) {
        loggerProvider.logger.warn('Redis delete error, cache not invalidated:', redisError)
      }
      // configData may now hold preserved (still-encrypted) secrets, so decrypt
      // before caching to honour "memory stores real data".
      const realConfig = decryptConfigSecrets(configData as IOrganizationConfiguration)
      if (realConfig) this.memoryConfigCache.set(String(userProfile.orgId), realConfig)

      return { message: 'Organization configuration saved successfully' }
    } catch (error: any) {
      loggerProvider.logger.error('createOrganizationConfiguration_Error', {
        error: error.message,
        stack: error.stack,
        orgId: userProfile.orgId,
      })
      throw error
    }
  }

  /**
   * Get organization configuration by ID
   * First checks Redis cache, if not available fetches from database and caches it
   */
  async getOrganizationConfigurationFromDb(orgId: string | number): Promise<IOrganizationConfiguration> {
    try {
      // L1: process-local cache already holds the decrypted, real config.
      const cached = this.memoryConfigCache.get(String(orgId))
      if (cached) return cached

      const config = await this.organizationConfigurationRepository.getOrganizationConfiguration({
        orgId: toObjectId(orgId),
        isDelete: false,
      })
      const real = decryptConfigSecrets(config as unknown as IOrganizationConfiguration)
      if (real) this.memoryConfigCache.set(String(orgId), real)
      return real as IOrganizationConfiguration
    } catch (error: any) {
      loggerProvider.logger.error('getOrganizationConfiguration_Error', {
        error: error.message,
        stack: error.stack,
        orgId,
      })
      throw error
    }
  }

  /**
   * Get organization configuration by ID
   * First checks Redis cache, if not available fetches from database and caches it
   */
  async getOrganizationConfiguration(orgId: string): Promise<IOrganizationConfiguration> {
    try {
      // L1: process-local cache already holds the decrypted, real config.
      const memHit = this.memoryConfigCache.get(String(orgId))
      if (memHit) return memHit

      const cacheKey = this.getOrganizationCacheKey(orgId)

      // L2: Redis stores the doc with secrets still encrypted-at-rest.
      try {
        const cachedData = await this.redisService.get(cacheKey)
        if (cachedData) {
          loggerProvider.logger.info(`Organization configuration found in cache for orgId: ${orgId}`)
          const real = decryptConfigSecrets(cachedData as IOrganizationConfiguration)!
          this.memoryConfigCache.set(String(orgId), real)
          return real
        }
      } catch (redisError) {
        loggerProvider.logger.warn('Redis get error, fetching from database:', redisError)
      }

      // If not in cache, get from database
      loggerProvider.logger.info(`Organization configuration not in cache, fetching from database for orgId: ${orgId}`)
      const config = await this.organizationConfigurationRepository.getOrganizationConfiguration({
        orgId: toObjectId(orgId),
        isDelete: false,
      })

      if (!config) {
        throw badRequest('Organization configuration not found')
      }

      // Save to Redis cache for future requests (encrypted-at-rest form)
      try {
        await this.redisService.set(cacheKey, JSON.stringify(config), this.CACHE_TTL)
        loggerProvider.logger.info(`Organization configuration cached for orgId: ${orgId}`)
      } catch (redisError) {
        loggerProvider.logger.warn('Redis set error, data not cached:', redisError)
      }

      const real = decryptConfigSecrets(config as unknown as IOrganizationConfiguration)!
      this.memoryConfigCache.set(String(orgId), real)
      return real as any
    } catch (error: any) {
      loggerProvider.logger.error('getOrganizationConfiguration_Error', {
        error: error.message,
        stack: error.stack,
        orgId,
      })
      throw error
    }
  }

  // Read the per-org WhatsApp task-notification settings (SuperAdmin-managed). Returns whatever is
  // stored; callers (TaskNotificationService.resolveConfig) apply defaults for any missing fields.
  async getTaskNotificationConfig(orgId: string): Promise<any> {
    const config = await this.getOrganizationConfiguration(orgId)
    return (config as any)?.taskNotificationConfig ?? {}
  }

  // Update the per-org task-notification settings. Deep-merges the provided patch over the stored
  // config (so partial updates don't wipe other fields) and invalidates the org-config cache.
  async updateTaskNotificationConfig(orgId: string, patch: any, userProfile: UserProfile): Promise<any> {
    try {
      const orgConfig = await this.getOrganizationConfiguration(orgId)
      if (!orgConfig) throw badRequest('Organization configuration not found')

      const current = (orgConfig as any).taskNotificationConfig ?? {}
      const merged = {
        ...current,
        ...patch,
        assignmentAlert: { ...(current.assignmentAlert ?? {}), ...(patch.assignmentAlert ?? {}) },
        dailyDigest: { ...(current.dailyDigest ?? {}), ...(patch.dailyDigest ?? {}) },
        dueToday: { ...(current.dueToday ?? {}), ...(patch.dueToday ?? {}) },
        preTaskReminder: { ...(current.preTaskReminder ?? {}), ...(patch.preTaskReminder ?? {}) },
        overdueEscalation: { ...(current.overdueEscalation ?? {}), ...(patch.overdueEscalation ?? {}) },
      }

      await this.organizationConfigurationRepository.updateOrganizationConfiguration(
        { _id: toObjectId((orgConfig as any)._id) },
        {
          taskNotificationConfig: merged,
          updatedBy: toObjectId(userProfile.userId),
          updatedAt: TimezoneUtil.nowUTC(),
        } as any,
      )

      try {
        await this.redisService.del(this.getOrganizationCacheKey(orgId))
      } catch (redisError) {
        loggerProvider.logger.warn('Redis delete error, cache not invalidated:', redisError)
      }
      // Drop the L1 entry so the next read repopulates with the merged config.
      this.memoryConfigCache.delete(String(orgId))

      return merged
    } catch (error: any) {
      loggerProvider.logger.error('updateTaskNotificationConfig_Error', { error: error.message, stack: error.stack, orgId })
      throw error
    }
  }



  async getOrganizationIdByPhoneNumber(phoneNumberId: string): Promise<null | string> {
    const cacheKey = this.getCacheKeyByPhoneNumber(phoneNumberId)
    try {
      const cachedData = await this.redisService.get(cacheKey)
      if (cachedData) {
        loggerProvider.logger.info(`Organization configuration found in cache for phoneNumberId: ${phoneNumberId}`)
        return cachedData.orgId
      } else {
        const orgConfig = await this.organizationConfigurationRepository.getOrganizationConfiguration({
          phoneNumbersId: { $in: [phoneNumberId] },
          isDelete: false,
        })
        if (orgConfig) {
          await this.redisService.set(
            cacheKey,
            JSON.stringify({
              orgId: orgConfig.orgId,
            }),
            this.CACHE_TTL,
          )
          loggerProvider.logger.info(`Organization configuration cached for phoneNumberId: ${phoneNumberId}`)
          return orgConfig.orgId as any
        }

        return null
      }
    } catch (redisError) {
      loggerProvider.logger.warn('Redis get error, fetching from database:', redisError)
      return null
    }

    // Try to get from Redis cache first
  }

  // If not in cache, get from database

  /**
   * Check if delete operations are allowed for the organization
   * Throws badRequest if delete is not allowed in the org configuration
   */
  async checkDeleteAllowed(orgId: string): Promise<void> {
    try {
      const config = await this.getOrganizationConfiguration(orgId)
      if (!config || !config.isDeleteAllowed) {
        throw badRequest('Delete operation is not allowed for this organization')
      }
    } catch (error: any) {
      if (error?.error?.status === 400 || error?.statusCode === 400) {
        throw error
      }
      loggerProvider.logger.error('checkDeleteAllowed_Error', {
        error: error.message,
        stack: error.stack,
        orgId,
      })
      throw badRequest('Delete operation is not allowed for this organization')
    }
  }






  /**
   * Preload every organization's configuration into the in-memory L1 cache,
   * decrypting at-rest secrets so internal callers read real values without a
   * round-trip. Safe to call on startup; failures are logged, never thrown, so
   * a cache warm-up problem can't take the server down.
   */
  async warmupConfigCache(): Promise<void> {
    try {
      const configs = await this.organizationConfigurationRepository.getOrganizationConfigurations({
        isDelete: false,
      })
      let loaded = 0
      for (const config of configs) {
        const orgId = (config as any)?.orgId
        if (!orgId) continue
        const real = decryptConfigSecrets(config as unknown as IOrganizationConfiguration)
        if (real) {
          this.memoryConfigCache.set(String(orgId), real)
          loaded++
        }
      }
      loggerProvider.logger.info(`Organization configuration cache warmed for ${loaded} org(s)`)
    } catch (error: any) {
      loggerProvider.logger.error('warmupConfigCache_Error', { error: error.message, stack: error.stack })
    }
  }

  /**
   * Get singleton instance
   */
  public static get Instance() {
    try {
      if (isNil(this.instance)) this.instance = new this()
      return this.instance
    } catch (error: any) {
      loggerProvider.logger.error('Instance_Error', { error: error.message, stack: error.stack })
      throw error
    }
  }
}
