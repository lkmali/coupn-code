import { JsonController, Post, Body, Get, QueryParam, Put } from 'routing-controllers'
import { OpenAPI } from 'routing-controllers-openapi'
import { OrganizationConfigurationService } from '../service'
import { Authorize, CurrentUser } from '../decorators'
import { Role, UserProfile } from '../typings'
import { awsConfigurationKey, HospitalRole } from '../config'
import {
  CreateOrganizationConfigurationDto,
  GetS3UploadUrlDto,
  UploadAudioByLanguageDto,
  UploadTestimonialMessageLanguageDto,
  PreviewTemplateDto,
  TaskNotificationConfigDto,
} from '../dto'
import { S3Service } from '../service/aws/s3.service'
import { TEMPLATE_DYNAMIC_KEYS } from '../constants'

/**
 * Organization Configuration Controller
 *
 * Handles all CRUD operations for organization configurations including:
 * - Creating new configurations
 * - Fetching configurations by ID or orgId
 * - Updating configurations
 * - Deleting (soft delete) configurations
 * - Toggling active status
 */
@JsonController('/organization-configuration')
export class OrganizationConfigurationController {
  private organizationConfigurationService = OrganizationConfigurationService.Instance
  private s3Service = S3Service.Instance

  /**
   * Create a new organization configuration
   * POST /organization-configuration
   */
  @Post()
  @Authorize([Role.ADMIN])
  @OpenAPI({
    summary: 'Create or update organization configuration',
    tags: ['Organization Configuration'],
    description: 'Creates or updates the organization configuration for the admin\'s organization. Includes working hours, WhatsApp integration settings, meta attributes, phone numbers, appointment templates, welcome messages, testimonial data, reminder schedules, and more.',
    requestBody: {
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/CreateOrganizationConfigurationDto' },
          example: {
            workingHours: {
              timezone: 'Asia/Kolkata',
              days: {
                monday: [{ startTime: 9, endTime: 13 }, { startTime: 14, endTime: 18 }],
                tuesday: [{ startTime: 9, endTime: 13 }, { startTime: 14, endTime: 18 }],
                wednesday: [{ startTime: 9, endTime: 13 }, { startTime: 14, endTime: 18 }],
                thursday: [{ startTime: 9, endTime: 13 }, { startTime: 14, endTime: 18 }],
                friday: [{ startTime: 9, endTime: 13 }, { startTime: 14, endTime: 17 }],
                saturday: [{ startTime: 9, endTime: 13 }],
              },
            },
            metaAttributes: {
              baseUrl: 'https://graph.facebook.com',
              version: 'v18.0',
              whatsapp: {
                phoneNumberId: '123456789012345',
              },
            },
            phoneNumberInformation: [
              { phoneNumber: '919876543210', location: 'Reception', isEnabled: true },
            ],
            organizationAddress: {
              address: '123 Healthcare Avenue, Mumbai, Maharashtra 400001',
              mapLink: 'https://maps.google.com/?q=19.0760,72.8777',
            },
            isDeleteAllowed: false,
            reminderConfig: {
              autoReminderEnabled: true,
              reminderTypes: ['WHATSAPP', 'EMAIL'],
              defaultReminderSchedules: [
                { type: 'WHATSAPP', offsetMinutes: 1440, direction: 'BEFORE', isEnabled: true },
                { type: 'WHATSAPP', offsetMinutes: 60, direction: 'BEFORE', isEnabled: true },
              ],
            },
          },
        },
      },
    },
    responses: {
      '200': {
        description: 'Organization configuration created/updated successfully',
        content: {
          'application/json': {
            example: {
              message: 'Organization configuration created successfully',
              data: {
                _id: '669960860c8379e64aea586a',
                orgId: '669960860c8379e64aea586b',
                workingHours: {
                  timezone: 'Asia/Kolkata',
                  days: {
                    monday: [{ startTime: 9, endTime: 13 }, { startTime: 14, endTime: 18 }],
                  },
                },
                isDeleteAllowed: false,
                createdAt: '2026-04-04T10:00:00.000Z',
                updatedAt: '2026-04-04T10:00:00.000Z',
              },
            },
          },
        },
      },
      '400': { description: 'Validation error - missing required working hours or invalid nested configuration' },
      '401': { description: 'Unauthorized - invalid or missing JWT token' },
      '403': { description: 'Forbidden - only ADMIN role can access this endpoint' },
    },
  })
  async createOrganizationConfiguration(
    @Body() body: CreateOrganizationConfigurationDto,
    @CurrentUser() userProfile: UserProfile,
  ) {
    const response = await this.organizationConfigurationService.createOrganizationConfiguration(body, userProfile)
    return {
      message: 'Organization configuration created successfully',
      data: response,
    }
  }

  /**
   * Get organization configuration for current user's organization
   * GET /organization-configuration/me
   */
  @Get('/me')
  @Authorize(HospitalRole)
  @OpenAPI({
    summary: 'Get my organization configuration',
    tags: ['Organization Configuration'],
    description: 'Retrieves the full organization configuration for the current user\'s organization. Includes working hours, WhatsApp settings, meta attributes, appointment templates (transformed to array format), and WhatsApp templates (transformed to array format).',
    responses: {
      '200': {
        description: 'Organization configuration retrieved successfully',
        content: {
          'application/json': {
            example: {
              _id: '669960860c8379e64aea586a',
              orgId: '669960860c8379e64aea586b',
              workingHours: {
                timezone: 'Asia/Kolkata',
                days: {
                  monday: [{ startTime: 9, endTime: 13 }, { startTime: 14, endTime: 18 }],
                },
              },
              metaAttributes: {
                baseUrl: 'https://graph.facebook.com',
                version: 'v18.0',
              },
              appointmentInformation: [
                {
                  language: 'English',
                  templates: [
                    { id: 'tpl_abc123', languageCode: 'en', type: 'APPOINTMENT_CONFIRMATION', isEnabled: true },
                  ],
                },
              ],
              whatsappTemplate: [
                { id: 'tpl_xyz789', languageCode: 'en', type: 'FOLLOW_UP', messageBody: 'Hi {{1}}, this is a follow-up message.', isEnabled: true },
              ],
              organizationAddress: {
                address: '123 Healthcare Avenue, Mumbai',
                mapLink: 'https://maps.google.com/?q=19.0760,72.8777',
              },
              reminderConfig: {
                autoReminderEnabled: true,
                reminderTypes: ['WHATSAPP'],
              },
            },
          },
        },
      },
      '401': { description: 'Unauthorized - invalid or missing JWT token' },
    },
  })
  async getMyOrganizationConfiguration(@CurrentUser() userProfile: UserProfile) {
    const response = await this.organizationConfigurationService.getOrganizationConfigurationFromDb(userProfile.orgId)

    // Transform appointmentInformation from nested object format to array format for admin UI
    let appointmentInformation: { language: string; templates: any[] }[] | undefined
    if (response.appointmentInformation) {
      appointmentInformation = Object.entries(response.appointmentInformation).map(([language, templates]) => ({
        language,
        templates: Object.entries(templates).map(([type, template]) => ({
          ...template,
          type,
        })),
      }))
    }

    // Transform whatsappTemplate from Record<type, template> to array format for admin UI
    let whatsappTemplate: any[] | undefined
    if (response.whatsappTemplate) {
      whatsappTemplate = Object.entries(response.whatsappTemplate).map(([type, template]) => ({
        ...template,
        type,
      }))
    }

    return {
      ...response,
      appointmentInformation,
      whatsappTemplate,
    }
  }

  /**
   * Generate S3 upload URL for public bucket
   * POST /organization-configuration/s3-upload-url
   */
  @Post('/s3-upload-url')
  @Authorize([Role.ADMIN])
  @OpenAPI({
    summary: 'Generate S3 upload URL',
    tags: ['Organization Configuration'],
    description: 'Generates a pre-signed S3 upload URL for the public bucket. Used to upload organization assets such as images, audio files, and documents. Returns both the upload URL (for PUT request) and the final public URL where the file will be accessible.',
    requestBody: {
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/GetS3UploadUrlDto' },
          example: {
            filename: 'clinic-logo.png',
            contentType: 'image/png',
          },
        },
      },
    },
    responses: {
      '200': {
        description: 'S3 upload URL generated successfully',
        content: {
          'application/json': {
            example: {
              message: 'S3 upload URL generated successfully',
              data: {
                uploadUrl: 'https://s3.amazonaws.com/public-bucket/669960860c8379e64aea586b/1712234400000/clinic-logo.png?X-Amz-Signature=...',
                publicUrl: 'https://cdn.example.com/669960860c8379e64aea586b/1712234400000/clinic-logo.png',
              },
            },
          },
        },
      },
      '400': { description: 'Validation error - missing filename or contentType' },
      '401': { description: 'Unauthorized - invalid or missing JWT token' },
      '403': { description: 'Forbidden - only ADMIN role can access this endpoint' },
    },
  })
  async getS3UploadUrl(@Body() body: GetS3UploadUrlDto, @CurrentUser() userProfile: UserProfile) {
    const date = new Date().valueOf()
    const key = `${userProfile.orgId}/${date}/${body.filename}`
    const uploadUrl = await this.s3Service.getPublicUploadSignedUrl(key, body.contentType)
    return {
      message: 'S3 upload URL generated successfully',
      data: {
        uploadUrl,
        publicUrl: `${awsConfigurationKey.s3Config.publicUrl}/${key}`,
      },
    }
  }

  /**
   * Upload audio to WhatsApp and store document ID by language
   * POST /organization-configuration/upload-audio-by-language
   */
  @Post('/upload-audio-by-language')
  @Authorize(HospitalRole)
  @OpenAPI({
    summary: 'Upload audio by language to WhatsApp',
    tags: ['Organization Configuration'],
    description: 'Uploads an audio file (MP3) to WhatsApp Media API and stores the resulting document ID mapped to the specified language. The audio file must already be uploaded to S3 and a public URL must be provided. Used for configuring welcome messages in different languages.',
    requestBody: {
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/UploadAudioByLanguageDto' },
          example: {
            language: 'Hindi',
            audioPublicUrl: 'https://cdn.example.com/669960860c8379e64aea586b/welcome-hindi.mp3',
          },
        },
      },
    },
    responses: {
      '200': {
        description: 'Audio uploaded to WhatsApp and document ID stored successfully',
        content: {
          'application/json': {
            example: {
              message: 'Audio uploaded to WhatsApp and document ID stored successfully',
            },
          },
        },
      },
      '400': { description: 'Validation error - invalid language, missing audioPublicUrl, or URL does not end with .mp3' },
      '401': { description: 'Unauthorized - invalid or missing JWT token' },
    },
  })
  async uploadAudioByLanguage(@Body() body: UploadAudioByLanguageDto, @CurrentUser() userProfile: UserProfile) {
    await this.organizationConfigurationService.uploadAudioByLanguage(body, userProfile)
    return {
      message: 'Audio uploaded to WhatsApp and document ID stored successfully',
    }
  }

  /**
   * Upload testimonial data to WhatsApp and store document ID by language
   * POST /organization-configuration/upload-testimonial-data-by-language
   */
  @Post('/upload-testimonial-data-by-language')
  @Authorize(HospitalRole)
  @OpenAPI({
    summary: 'Upload testimonial data by language',
    tags: ['Organization Configuration'],
    description: 'Uploads testimonial media (image, video, or text) to WhatsApp Media API and stores the resulting document ID mapped to the specified language. For media types, the file must already be uploaded to S3 and a public URL provided. For text type, the body field is used instead.',
    requestBody: {
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/UploadTestimonialMessageLanguageDto' },
          example: {
            language: 'English',
            publicUrl: 'https://cdn.example.com/669960860c8379e64aea586b/testimonial-en.mp4',
            type: 'video',
          },
        },
      },
    },
    responses: {
      '200': {
        description: 'Testimonial data uploaded and document ID stored successfully',
        content: {
          'application/json': {
            example: {
              message: 'Testimonial data uploaded to WhatsApp and document ID stored successfully',
            },
          },
        },
      },
      '400': { description: 'Validation error - invalid language, invalid type, or missing publicUrl for non-text types' },
      '401': { description: 'Unauthorized - invalid or missing JWT token' },
    },
  })
  async uploadTestimonialData(
    @Body() body: UploadTestimonialMessageLanguageDto,
    @CurrentUser() userProfile: UserProfile,
  ) {
    await this.organizationConfigurationService.uploadTestimonialData(body, userProfile)
    return {
      message: 'Testimonial data uploaded to WhatsApp and document ID stored successfully',
    }
  }

  /**
   * Get all template names for the organization
   * GET /organization-configuration/templates
   */
  @Get('/templates')
  @Authorize(HospitalRole)
  @OpenAPI({
    summary: 'Get all templates',
    tags: ['Organization Configuration'],
    description: 'Retrieves all WhatsApp template configurations for the organization. Optionally filter to only templates marked for UI display by passing showOnUIOnly=true.',
    responses: {
      '200': {
        description: 'Templates fetched successfully',
        content: {
          'application/json': {
            example: {
              message: 'Templates fetched successfully',
              data: [
                {
                  id: 'tpl_abc123',
                  type: 'APPOINTMENT_CONFIRMATION',
                  languageCode: 'en',
                  templateTitle: 'Appointment Confirmation',
                  messageBody: 'Hi {{1}}, your appointment on {{2}} at {{3}} is confirmed.',
                  isEnabled: true,
                  needToShowOnUI: true,
                },
                {
                  id: 'tpl_xyz789',
                  type: 'FOLLOW_UP',
                  languageCode: 'en',
                  templateTitle: 'Follow Up',
                  messageBody: 'Hi {{1}}, how are you feeling after your recent visit?',
                  isEnabled: true,
                  needToShowOnUI: false,
                },
              ],
            },
          },
        },
      },
      '401': { description: 'Unauthorized - invalid or missing JWT token' },
    },
  })
  async getAllTemplates(
    @QueryParam('showOnUIOnly') showOnUIOnly: boolean,
    @CurrentUser() userProfile: UserProfile,
  ) {
    const data = await this.organizationConfigurationService.getAllTemplates(
      userProfile.orgId,
      showOnUIOnly,
    )
    return {
      message: 'Templates fetched successfully',
      data,
    }
  }

  /**
   * Get all templates where needToShowOnUI is true
   * GET /organization-configuration/templates/ui
   */
  @Get('/templates/ui')
  @Authorize(HospitalRole)
  @OpenAPI({
    summary: 'Get UI-visible templates',
    tags: ['Organization Configuration'],
    description: 'Retrieves only the WhatsApp templates that are configured to be shown on the UI (needToShowOnUI = true). This is a convenience endpoint equivalent to calling GET /templates?showOnUIOnly=true.',
    responses: {
      '200': {
        description: 'UI templates fetched successfully',
        content: {
          'application/json': {
            example: {
              message: 'Templates fetched successfully',
              data: [
                {
                  id: 'tpl_abc123',
                  type: 'APPOINTMENT_CONFIRMATION',
                  languageCode: 'en',
                  templateTitle: 'Appointment Confirmation',
                  messageBody: 'Hi {{1}}, your appointment on {{2}} at {{3}} is confirmed.',
                  isEnabled: true,
                  needToShowOnUI: true,
                },
              ],
            },
          },
        },
      },
      '401': { description: 'Unauthorized - invalid or missing JWT token' },
    },
  })
  async getUITemplates(@CurrentUser() userProfile: UserProfile) {
    const data = await this.organizationConfigurationService.getUITemplates(userProfile.orgId)
    return {
      message: 'Templates fetched successfully',
      data,
    }
  }

  /**
   * Get the static map of dynamic variable keys per template type.
   * Used by the SuperAdmin UI to populate the valueKey dropdown when authoring
   * dynamic-template parameters, so admins pick from known keys instead of typing.
   * GET /organization-configuration/templates/dynamic-keys
   */
  @Get('/templates/dynamic-keys')
  @Authorize(HospitalRole)
  @OpenAPI({
    summary: 'Get dynamic variable keys available per template type',
    tags: ['Organization Configuration'],
    description:
      'Returns a map of templateType -> string[] listing the variable keys the backend populates at send time for that template type. The SuperAdmin UI uses this to offer a typo-free dropdown when configuring dynamic component parameters.',
    responses: {
      '200': {
        description: 'Dynamic keys map fetched successfully',
        content: {
          'application/json': {
            example: {
              message: 'Dynamic keys fetched successfully',
              data: {
                WELCOME_MESSAGE: ['name', 'patientName', 'insuranceProvider'],
                DR_APPOINTMENT_CONFIRMATION_MESSAGE: [
                  'doctorName',
                  'status',
                  'patientName',
                  'patientMobile',
                  'appointmentType',
                  'appointmentDate',
                  'appointmentTime',
                  'leadId',
                ],
              },
            },
          },
        },
      },
      '401': { description: 'Unauthorized - invalid or missing JWT token' },
    },
  })
  async getTemplateDynamicKeys() {
    return {
      message: 'Dynamic keys fetched successfully',
      data: TEMPLATE_DYNAMIC_KEYS,
    }
  }

  /**
   * Preview a template with resolved entity data
   * POST /organization-configuration/templates/preview
   */
  @Post('/templates/preview')
  @Authorize(HospitalRole)
  @OpenAPI({
    summary: 'Preview a template with resolved data',
    tags: ['Organization Configuration'],
    description: 'Generates a preview of a WhatsApp template by resolving placeholder variables (e.g., {{1}}, {{2}}) with actual entity data. The referenceId identifies the target entity (lead/patient) and templateType specifies which template to preview. Optionally specify a language for multi-language templates.',
    requestBody: {
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/PreviewTemplateDto' },
          example: {
            referenceId: '669960860c8379e64aea586a',
            templateType: 'APPOINTMENT_CONFIRMATION',
            language: 'English',
          },
        },
      },
    },
    responses: {
      '200': {
        description: 'Template preview generated successfully',
        content: {
          'application/json': {
            example: {
              message: 'Template preview generated successfully',
              data: {
                templateTitle: 'Appointment Confirmation',
                messageBody: 'Hi Priya Sharma, your appointment on April 5, 2026 at 10:00 AM is confirmed. Please arrive 15 minutes early.',
                buttons: ['Confirm', 'Reschedule'],
              },
            },
          },
        },
      },
      '400': { description: 'Validation error - missing referenceId or templateType' },
      '401': { description: 'Unauthorized - invalid or missing JWT token' },
      '404': { description: 'Reference entity or template not found' },
    },
  })
  async previewTemplate(
    @Body() body: PreviewTemplateDto,
    @CurrentUser() userProfile: UserProfile,
  ) {
    const data = await this.organizationConfigurationService.previewTemplate(
      userProfile.orgId,
      body,
    )
    return {
      message: 'Template preview generated successfully',
      data,
    }
  }

  /**
   * Get the per-org WhatsApp task-notification settings (SuperAdmin).
   * GET /organization-configuration/task-notification-config
   */
  @Get('/task-notification-config')
  @Authorize([Role.SUPER_ADMIN, Role.ADMIN])
  @OpenAPI({
    summary: 'Get task-notification settings',
    description: 'Returns the per-org WhatsApp task-notification configuration (enable flags, digest time, reminder lead/overdue thresholds, timezone).',
    tags: ['Organization Configuration', 'Notifications'],
  })
  async getTaskNotificationConfig(@CurrentUser() userProfile: UserProfile) {
    const data = await this.organizationConfigurationService.getTaskNotificationConfig(userProfile.orgId)
    return { message: 'Task notification config fetched', data }
  }

  /**
   * Update the per-org WhatsApp task-notification settings (SuperAdmin).
   * PUT /organization-configuration/task-notification-config
   */
  @Put('/task-notification-config')
  @Authorize([Role.SUPER_ADMIN, Role.ADMIN])
  @OpenAPI({
    summary: 'Update task-notification settings',
    description: 'Deep-merges the provided patch over the stored task-notification config and invalidates the org-config cache. All fields optional.',
    tags: ['Organization Configuration', 'Notifications'],
  })
  async updateTaskNotificationConfig(@Body() body: TaskNotificationConfigDto, @CurrentUser() userProfile: UserProfile) {
    const data = await this.organizationConfigurationService.updateTaskNotificationConfig(userProfile.orgId, body, userProfile)
    return { message: 'Task notification config updated', data }
  }
}
