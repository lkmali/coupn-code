import {
  IWhatsAppTemplate,
  IWhatsAppTemplateDocuments,
  IOrganizationConfiguration,
  TestimonialType,
  UserProfile,
  AppointmentTemplateType,
  WhatsAppTemplateType,
} from '../typings'
import { badRequest, isNil, notFoundData } from '../utils'
import {
  MongoOrganizationConfigurationRepository,
  MongoLeadRepository,
  MongoPatientRepository,
  MongoAppointmentRepository,
  toObjectId,
} from '@anantai/common'
import { LoggerProvider } from '../provider/logger.provider'
import {
  CreateOrganizationConfigurationDto,
  UploadAudioByLanguageDto,
  UploadTestimonialMessageLanguageDto,
  PreviewTemplateDto,
} from '../dto'
import { RedisService } from './redis.service'
import { EXOTEL_WEBHOOK_TOKEN_REDIS_KEY } from './exotel.service'
import { TimezoneUtil } from '../utils/timezone.util'
import { omit } from 'lodash'
import { replaceTemplateVariables } from '../utils/templateUtils'
import moment from 'moment-timezone'
import { randomBytes } from 'crypto'
// import { WhatsAppChatService } from './meta/whatsAppChat'

const loggerProvider = LoggerProvider.Instance

export class OrganizationConfigurationService {
  private readonly redisService: RedisService
  //   private readonly whatsAppChatService: WhatsAppChatService
  private static instance: OrganizationConfigurationService
  private readonly organizationConfigurationRepository: MongoOrganizationConfigurationRepository
  private readonly leadRepository: MongoLeadRepository
  private readonly patientRepository: MongoPatientRepository
  private readonly appointmentRepository: MongoAppointmentRepository
  private readonly CACHE_TTL = 3600 // 1 hour in seconds
  private readonly CACHE_KEY_PREFIX = 'org_config:'

  constructor() {
    this.organizationConfigurationRepository = new MongoOrganizationConfigurationRepository()
    this.leadRepository = new MongoLeadRepository()
    this.patientRepository = new MongoPatientRepository()
    this.appointmentRepository = new MongoAppointmentRepository()
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
      this.validateWorkingHours(data.workingHours)
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

      // appointmentInformation - structured as { LANGUAGE: { TEMPLATE_TYPE: {...} } }
      if (Array.isArray(data.appointmentInformation) && data.appointmentInformation.length > 0) {
        configData.appointmentInformation = data.appointmentInformation.reduce(
          (acc, curr) => {
            const langKey = curr.language.toUpperCase()
            if (!acc[langKey]) {
              acc[langKey] = {}
            }
            // Process each template in the templates array
            if (Array.isArray(curr.templates)) {
              curr.templates.forEach(template => {
                acc[langKey][template.type] = {
                  type: template.type,
                  id: template.id,
                  languageCode: template.languageCode,

                  isEnabled: template.isEnabled,
                  needToShowOnUI: template.needToShowOnUI ?? true,
                  imageUrl: template.imageUrl,
                  documents: template.documents as IWhatsAppTemplateDocuments,
                  ...(template.templateTitle ? { templateTitle: template.templateTitle } : {}),
                  ...(template.messageBody ? { messageBody: template.messageBody } : {}),
                  ...(template.buttons ? { buttons: template.buttons } : { buttons: [] }),
                  ...(template.templateParameters ? { templateParameters: template.templateParameters } : {}),
                  ...(Array.isArray(template.components) && template.components.length > 0
                    ? { components: template.components }
                    : {}),
                }
              })
            }
            return acc
          },
          {} as Record<string, Record<string, IWhatsAppTemplate>>,
        )
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

      // organizationAddress
      if (data.organizationAddress) {
        configData.organizationAddress = data.organizationAddress
      }

      // welcomeMessage reducer
      if (Array.isArray(data.welcomeMessage) && data.welcomeMessage.length > 0) {
        configData.welcomeMessage = data.welcomeMessage.reduce(
          (acc, curr) => {
            const key = curr.language.toUpperCase()
            acc[key] = {
              audioS3Url: curr.audioPublicUrl, // FIXED! correct mapping
              whatsappDocumentId: '',
            }
            return acc
          },
          {} as Record<string, { audioS3Url: string; whatsappDocumentId?: string }>,
        )
      }

      // testimonialMessage reducer
      if (Array.isArray(data.testimonialMessage) && data.testimonialMessage.length > 0) {
        configData.testimonialMessage = data.testimonialMessage.reduce(
          (acc, curr) => {
            const key = curr.language.toUpperCase()
            acc[key] = {
              publicUrl: curr.publicUrl,
              type: curr.type,
              ...(curr.body ? { body: curr.body } : {}),
            }
            return acc
          },
          {} as Record<string, { publicUrl?: string; type: TestimonialType; body?: string }>,
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

      if (existingConfig) {
        const { orgId: _omitOrgId, createdAt: _omitCreatedAt, createdBy: _omitCreatedBy, ...updateBody } = configData
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
            ...configData,
            adminUserId: userProfile.userId,
            testimonialMessage: configData?.testimonialMessage ?? {},
            welcomeMessage: configData?.welcomeMessage ?? {},
            whatsappTemplate: configData?.whatsappTemplate ?? {},
          },
          {},
        )
      }

      // Invalidate Redis cache after creating/updating configuration
      try {
        const cacheKey = this.getOrganizationCacheKey(userProfile.orgId)
        await this.redisService.del(cacheKey)
        loggerProvider.logger.info(`Cache invalidated for orgId: ${userProfile.orgId}`)
      } catch (redisError) {
        loggerProvider.logger.warn('Redis delete error, cache not invalidated:', redisError)
      }

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
      const config = await this.organizationConfigurationRepository.getOrganizationConfiguration({
        orgId: toObjectId(orgId),
        isDelete: false,
      })
      return config as unknown as IOrganizationConfiguration
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
      const cacheKey = this.getOrganizationCacheKey(orgId)

      // Try to get from Redis cache first
      try {
        const cachedData = await this.redisService.get(cacheKey)
        if (cachedData) {
          loggerProvider.logger.info(`Organization configuration found in cache for orgId: ${orgId}`)
          return cachedData
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

      // Save to Redis cache for future requests
      try {
        await this.redisService.set(cacheKey, JSON.stringify(config), this.CACHE_TTL)
        loggerProvider.logger.info(`Organization configuration cached for orgId: ${orgId}`)
      } catch (redisError) {
        loggerProvider.logger.warn('Redis set error, data not cached:', redisError)
      }

      return config as any
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

      return merged
    } catch (error: any) {
      loggerProvider.logger.error('updateTaskNotificationConfig_Error', { error: error.message, stack: error.stack, orgId })
      throw error
    }
  }

  /**
   * Upload audio to WhatsApp and store document ID by language
   * This method:
   * 1. Gets the current organization configuration
   * 2. Uploads the audio file to WhatsApp using the provided public URL
   * 3. Stores the document ID in the welcomeMessage array for the specified language
   */
  async uploadAudioByLanguage(data: UploadAudioByLanguageDto, userProfile: UserProfile): Promise<void> {
    try {
      // Get current organization configuration
      const orgConfig = await this.getOrganizationConfiguration(userProfile.orgId)

      if (!orgConfig || !orgConfig.metaAttributes) {
        throw badRequest('Organization configuration not found')
      }

      // Upload audio to WhatsApp and get document ID
      loggerProvider.logger.info('Uploading audio to WhatsApp', {
        language: data.language,
        url: data.audioPublicUrl,
      })

      //   const whatsappDocumentId = await this.whatsAppChatService.uploadWhatsAppMedia(
      //     data.audioPublicUrl,
      //     orgConfig.metaAttributes,
      //   )

      //   loggerProvider.logger.info('Audio uploaded successfully to WhatsApp', {
      //     language: data.language,
      //     whatsappDocumentId,
      //   })

      const welcomeMessage = orgConfig.welcomeMessage ?? {}

      // Initialize welcomeMessage object if it doesn't exist

      // Set or update the welcome message for this language
      welcomeMessage[data.language.toLocaleUpperCase()] = {
        audioS3Url: data.audioPublicUrl,
        whatsappDocumentId: '',
      }

      // Update organization configuration in database
      await this.organizationConfigurationRepository.updateOrganizationConfiguration(
        { _id: toObjectId((orgConfig as any)._id) },
        {
          welcomeMessage,
          updatedBy: toObjectId(userProfile.userId),
          updatedAt: TimezoneUtil.nowUTC(),
        },
      )

      // Invalidate Redis cache
      try {
        const cacheKey = this.getOrganizationCacheKey(userProfile.orgId)
        await this.redisService.del(cacheKey)
        loggerProvider.logger.info(`Cache invalidated for orgId: ${userProfile.orgId}`)
      } catch (redisError) {
        loggerProvider.logger.warn('Redis delete error, cache not invalidated:', redisError)
      }
    } catch (error: any) {
      loggerProvider.logger.error('uploadAudioByLanguage_Error', {
        error: error.message,
        stack: error.stack,
        language: data.language,
        orgId: userProfile.orgId,
      })
      throw error
    }
  }

  /**
   * Upload audio to WhatsApp and store document ID by language
   * This method:
   * 1. Gets the current organization configuration
   * 2. Uploads the audio file to WhatsApp using the provided public URL
   * 3. Stores the document ID in the welcomeMessage array for the specified language
   */
  async uploadTestimonialData(data: UploadTestimonialMessageLanguageDto, userProfile: UserProfile): Promise<void> {
    try {
      // Get current organization configuration
      const orgConfig = await this.getOrganizationConfiguration(userProfile.orgId)

      if (!orgConfig || !orgConfig.metaAttributes) {
        throw badRequest('Organization configuration not found')
      }

      // Upload audio to WhatsApp and get document ID
      loggerProvider.logger.info('Uploading audio to WhatsApp', {
        language: data.language,
        url: data.publicUrl,
      })

      //   const whatsappDocumentId = await this.whatsAppChatService.uploadWhatsAppMedia(
      //     data.audioPublicUrl,
      //     orgConfig.metaAttributes,
      //   )

      //   loggerProvider.logger.info('Audio uploaded successfully to WhatsApp', {
      //     language: data.language,
      //     whatsappDocumentId,
      //   })

      const testimonialMessage = orgConfig.testimonialMessage ?? {}

      // Initialize testimonialMessage object if it doesn't exist

      // Set or update the testimonial message for this language
      testimonialMessage[data.language.toLocaleUpperCase()] = {
        publicUrl: data.publicUrl,
        type: data.type,
        body: data.body,
      }

      // Update organization configuration in database
      await this.organizationConfigurationRepository.updateOrganizationConfiguration(
        { _id: toObjectId((orgConfig as any)._id) },
        {
          testimonialMessage,
          updatedBy: toObjectId(userProfile.userId),
          updatedAt: TimezoneUtil.nowUTC(),
        },
      )

      // Invalidate Redis cache
      try {
        const cacheKey = this.getOrganizationCacheKey(userProfile.orgId)
        await this.redisService.del(cacheKey)
        loggerProvider.logger.info(`Cache invalidated for orgId: ${userProfile.orgId}`)
      } catch (redisError) {
        loggerProvider.logger.warn('Redis delete error, cache not invalidated:', redisError)
      }
    } catch (error: any) {
      loggerProvider.logger.error('uploadAudioByLanguage_Error', {
        error: error.message,
        stack: error.stack,
        language: data.language,
        orgId: userProfile.orgId,
      })
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
   * Validate working hours structure
   */
  private validateWorkingHours(workingHours: any): void {
    try {
      if (!workingHours || !workingHours.timezone || !workingHours.days) {
        throw badRequest('Invalid working hours structure: timezone and days are required')
      }

      // Validate each day's time slots
      for (const [day, slots] of Object.entries(workingHours.days)) {
        if (!Array.isArray(slots)) {
          throw badRequest(`Invalid working hours for day ${day}: slots must be an array`)
        }

        for (const slot of slots as any[]) {
          if (typeof slot.startTime !== 'number' || typeof slot.endTime !== 'number') {
            throw badRequest(`Invalid time slot for day ${day}: startTime and endTime must be numbers`)
          }

          if (slot.startTime < 0 || slot.startTime > 24 || slot.endTime < 0 || slot.endTime > 24) {
            throw badRequest(`Invalid time slot for day ${day}: times must be between 0 and 24`)
          }

          if (slot.startTime >= slot.endTime) {
            throw badRequest(`Invalid time slot for day ${day}: startTime must be less than endTime`)
          }
        }
      }
    } catch (error: any) {
      loggerProvider.logger.error('validateWorkingHours_Error', { error: error.message, stack: error.stack })
      throw error
    }
  }

  /**
   * Get all templates configured for an organization
   */
  async getAllTemplates(
    orgId: string,
    showOnUIOnly?: boolean,
  ): Promise<{
    appointmentTemplates: any[]
    whatsappTemplates: any[]
  }> {
    try {
      const config = await this.getOrganizationConfiguration(orgId)

      const appointmentTemplates: any[] = []
      if (config.appointmentInformation) {
        for (const [language, templates] of Object.entries(config.appointmentInformation)) {
          for (const [type, template] of Object.entries(templates)) {
            if (showOnUIOnly && template.needToShowOnUI === false) continue
            appointmentTemplates.push({
              ...template,
              type,
              language,
            })
          }
        }
      }

      const whatsappTemplates: any[] = []
      if (config.whatsappTemplate) {
        for (const [type, template] of Object.entries(config.whatsappTemplate)) {
          if (showOnUIOnly && template.needToShowOnUI === false) continue
          whatsappTemplates.push({
            ...template,
            type,
          })
        }
      }

      return { appointmentTemplates, whatsappTemplates }
    } catch (error: any) {
      loggerProvider.logger.error('getAllTemplates_Error', {
        error: error.message,
        stack: error.stack,
        orgId,
      })
      throw error
    }
  }

  /**
   * Get all templates where needToShowOnUI is true
   */
  async getUITemplates(orgId: string): Promise<{ appointmentTemplates: any[]; whatsappTemplates: any[] }> {
    try {
      const config = await this.getOrganizationConfiguration(orgId)

      const appointmentTemplates: any[] = []
      if (config.appointmentInformation) {
        for (const [language, templates] of Object.entries(config.appointmentInformation)) {
          for (const [type, template] of Object.entries(templates)) {
            if (template.needToShowOnUI) {
              appointmentTemplates.push({ ...template, type, language })
            }
          }
        }
      }

      const whatsappTemplates: any[] = []
      if (config.whatsappTemplate) {
        for (const [type, template] of Object.entries(config.whatsappTemplate)) {
          if (template.needToShowOnUI) {
            whatsappTemplates.push({ ...template, type })
          }
        }
      }

      return { appointmentTemplates, whatsappTemplates }
    } catch (error: any) {
      loggerProvider.logger.error('getUITemplates_Error', {
        error: error.message,
        stack: error.stack,
        orgId,
      })
      throw error
    }
  }

  /**
   * Preview a template by resolving referenceId to entity data and rendering template variables
   */
  async previewTemplate(orgId: string, dto: PreviewTemplateDto): Promise<any> {
    try {
      const config = await this.getOrganizationConfiguration(orgId)
      const { referenceId, templateType, language } = dto

      // Find the template
      let template: IWhatsAppTemplate | null = null

      // Check whatsappTemplate first (language-agnostic)
      if (config.whatsappTemplate?.[templateType]) {
        template = config.whatsappTemplate[templateType]
      }

      // Check appointmentInformation (language-specific)
      if (!template && config.appointmentInformation) {
        const lang = language?.toUpperCase() || 'ENGLISH'
        if (config.appointmentInformation[lang]?.[templateType]) {
          template = config.appointmentInformation[lang][templateType]
        }
        // Fallback: search all languages if not found in specified language
        if (!template) {
          for (const [, templates] of Object.entries(config.appointmentInformation)) {
            if (templates[templateType]) {
              template = templates[templateType]
              break
            }
          }
        }
      }

      if (!template) {
        throw notFoundData(`Template not found for type: ${templateType}`)
      }

      // Determine entity type and fetch data
      const appointmentTypes = [
        AppointmentTemplateType.BOOK_APPOINTMENT,
        AppointmentTemplateType.CANCEL_APPOINTMENT,
        AppointmentTemplateType.APPOINTMENT_REMINDER,
        AppointmentTemplateType.SEND_ADDRESS,
        AppointmentTemplateType.SEND_USER_NOTIFICATION_BY_ADMIN,
      ]

      let entityData: any = null
      let variables: string[] = []

      if (appointmentTypes.includes(templateType as AppointmentTemplateType)) {
        // Try appointment first
        const appointment = await this.appointmentRepository.getAppointment({
          _id: toObjectId(referenceId),
          orgId: toObjectId(orgId),
        })

        if (appointment) {
          // Fetch associated lead/patient
          let userName = ''
          let mobileNumber = ''
          if ((appointment as any).leadId) {
            const lead = await this.leadRepository.getLead({
              _id: toObjectId((appointment as any).leadId),
              orgId: toObjectId(orgId),
            })
            userName = lead?.name || ''
            mobileNumber = lead?.mobileNumber || ''
          } else if ((appointment as any).patientId) {
            const patient = await this.patientRepository.getSinglePatient({
              _id: toObjectId((appointment as any).patientId),
              orgId: toObjectId(orgId),
            })
            userName = patient?.name || ''
            mobileNumber = patient?.mobileNumber || ''
          }

          const startDate = moment(appointment.startDate).format('MM/DD/YYYY')
          const startTime = moment(appointment.startDate).format('h:mm A')

          if (
            templateType === AppointmentTemplateType.BOOK_APPOINTMENT ||
            templateType === AppointmentTemplateType.CANCEL_APPOINTMENT
          ) {
            variables = [
              appointment.status || '',
              userName,
              appointment.appointmentType || '',
              startDate,
              startTime,
              (appointment as any).meetingLink || '',
            ]
          } else if (templateType === AppointmentTemplateType.APPOINTMENT_REMINDER) {
            variables = [userName, startDate, startTime]
          } else if (templateType === AppointmentTemplateType.SEND_ADDRESS) {
            variables = [userName, config.organizationAddress?.address || '']
          } else if (templateType === AppointmentTemplateType.SEND_USER_NOTIFICATION_BY_ADMIN) {
            variables = [userName, userName, startDate, startTime]
          }

          entityData = {
            type: 'appointment',
            id: referenceId,
            name: userName,
            mobileNumber,
          }
        } else {
          throw notFoundData(`Appointment not found for referenceId: ${referenceId}`)
        }
      } else {
        // For FOLLOW_UP_REMINDER, WELCOME_MESSAGE, CALL_ALERT — try lead first, then patient
        let lead = await this.leadRepository.getLead({
          _id: toObjectId(referenceId),
          orgId: toObjectId(orgId),
        })

        if (lead) {
          // lead found
          entityData = {
            type: 'lead',
            id: referenceId,
            name: lead.name || '',
            mobileNumber: lead.mobileNumber || '',
          }

          if (
            templateType === AppointmentTemplateType.FOLLOW_UP_REMINDER ||
            templateType === WhatsAppTemplateType.WELCOME_MESSAGE
          ) {
            variables = [lead.name || '']
          } else if (templateType === WhatsAppTemplateType.CALL_ALERT) {
            variables = ['', lead.name || '', '', moment().format('h:mm A')]
          }
        } else {
          // Try patient
          const patient = await this.patientRepository.getSinglePatient({
            _id: toObjectId(referenceId),
            orgId: toObjectId(orgId),
          })

          if (patient) {
            // patient found
            entityData = {
              type: 'patient',
              id: referenceId,
              name: patient.name || '',
              mobileNumber: patient.mobileNumber || '',
            }

            if (
              templateType === AppointmentTemplateType.FOLLOW_UP_REMINDER ||
              templateType === WhatsAppTemplateType.WELCOME_MESSAGE
            ) {
              variables = [patient.name || '']
            } else if (templateType === WhatsAppTemplateType.CALL_ALERT) {
              variables = ['', patient.name || '', '', moment().format('h:mm A')]
            }
          } else {
            throw notFoundData(`No lead or patient found for referenceId: ${referenceId}`)
          }
        }
      }

      // Render the template
      const renderedMessage = template.messageBody ? replaceTemplateVariables(template.messageBody, variables) : ''

      return {
        template: {
          type: template.type,
          id: template.id,
          languageCode: template.languageCode,
          messageBody: template.messageBody || '',
          renderedMessage,
          variables,
          buttons: template.buttons || [],
          imageUrl: template.imageUrl,
        },
        entity: entityData,
      }
    } catch (error: any) {
      loggerProvider.logger.error('previewTemplate_Error', {
        error: error.message,
        stack: error.stack,
        orgId,
        referenceId: dto.referenceId,
        templateType: dto.templateType,
      })
      throw error
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
