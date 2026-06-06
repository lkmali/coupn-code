import { JsonController, Post, Body, Get } from 'routing-controllers'
import { OpenAPI } from 'routing-controllers-openapi'
import { OrganizationConfigurationService } from '../service'
import { Authorize, CurrentUser } from '../decorators'
import { Role, UserProfile } from '../typings'
import { awsConfigurationKey } from '../config'
import {
  CreateOrganizationConfigurationDto,
  GetS3UploadUrlDto
} from '../dto'
import { S3Service } from '../service/aws/s3.service'

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

    // No configuration exists yet for this organization
    if (!response) {
      return null
    }

    // Transform appointmentInformation from nested object format to array format for admin UI
    let appointmentInformation: { language: string; templates: any[] }[] | undefined

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

}
