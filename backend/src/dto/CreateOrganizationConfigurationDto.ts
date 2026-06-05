import {
  IsNotEmpty,
  IsString,
  IsObject,
  IsOptional,
  ValidateNested,
  IsArray,
  IsNumber,
  Min,
  Max,
  IsUrl,
  IsEnum,
  IsBoolean,
} from 'class-validator'
import { Type } from 'class-transformer'
import { CleanOptional } from '../decorators'
import { UploadTestimonialMessageLanguageDto } from './UploadTestimonialMessageLanguageDto'
import { UploadAudioByLanguageDto } from './UploadAudioByLanguageDto'
import { Language, AppointmentTemplateType } from '../typings'
import { StoredTemplateComponent } from '../typings/model'
import { ExotelConfigurationDto } from './ExotelDto'
import { TaskNotificationConfigDto } from './TaskNotificationConfigDto'

/**
 * Working hours time slot
 */
export class TimeSlotDto {
  @IsNumber()
  @Min(0, { message: 'Start time must be between 0 and 24' })
  @Max(24, { message: 'Start time must be between 0 and 24' })
  startTime!: number

  @IsNumber()
  @Min(0, { message: 'End time must be between 0 and 24' })
  @Max(24, { message: 'End time must be between 0 and 24' })
  endTime!: number
}

/**
 * Working hours configuration
 */
export class WorkingHoursDto {
  @IsString()
  @IsNotEmpty({ message: 'Timezone should not be empty' })
  timezone!: string

  @IsObject()
  @IsNotEmpty({ message: 'Days configuration is required' })
  days!: Record<string, TimeSlotDto[]>
}

/**
 * Facebook Lead configuration
 */
export class FacebookLeadDto {
  @IsString()
  @IsNotEmpty()
  fields!: string
}

export class WhatsappTemplateDto {
  @IsOptional()
  @CleanOptional()
  @IsString()
  id?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  languageCode?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  imageUrl?: string

  @IsOptional()
  @CleanOptional()
  @IsObject()
  documents?: { headers?: { type: string; link: string }[]; body?: { type: string; link: string }[] }
}
/**
 * WhatsApp configuration
 */
export class WhatsappConfigDto {
  @IsOptional()
  @CleanOptional()
  @IsString()
  token?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  phoneNumberId?: string

  @IsOptional()
  @CleanOptional()
  @ValidateNested()
  @Type(() => WhatsappTemplateDto)
  welcomeMessageTemplate?: WhatsappTemplateDto

  @IsOptional()
  @CleanOptional()
  @ValidateNested()
  @Type(() => WhatsappTemplateDto)
  welcomeLanguageMessageTemplate?: WhatsappTemplateDto

  @IsOptional()
  @CleanOptional()
  @ValidateNested()
  @Type(() => WhatsappTemplateDto)
  followUpMessageTemplate?: WhatsappTemplateDto
}

/**
 * Messenger configuration
 */
export class MessengerConfigDto {
  @IsOptional()
  @CleanOptional()
  @IsString()
  pageId?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  token?: string
}

/**
 * Instagram configuration
 */
export class InstagramConfigDto {
  @IsOptional()
  @CleanOptional()
  @IsString()
  token?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  userId?: string
}

/**
 * Phone number information DTO
 */
export class PhoneNumberInfoDto {
  @IsString()
  @IsNotEmpty({ message: 'Phone number is required' })
  phoneNumber!: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  location?: string


  @IsOptional()
  @CleanOptional()
  @IsBoolean({ message: 'isEnabled must be a boolean' })
  isEnabled?: boolean

}

/**
 * Meta attributes for organization configuration
 */
export class MetaAttributesDto {
  @IsOptional()
  @CleanOptional()
  @IsString()
  baseUrl?: string


  @IsOptional()
  @CleanOptional()
  @IsString()
  whatsappAgentsUrl?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  version?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  appSecret?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  userAccessToken?: string

  @IsOptional()
  @CleanOptional()
  @ValidateNested()
  @Type(() => FacebookLeadDto)
  facebookLead?: FacebookLeadDto

  @IsOptional()
  @CleanOptional()
  @ValidateNested()
  @Type(() => WhatsappConfigDto)
  whatsapp?: WhatsappConfigDto

  @IsOptional()
  @CleanOptional()
  @ValidateNested()
  @Type(() => MessengerConfigDto)
  messenger?: MessengerConfigDto

  @IsOptional()
  @CleanOptional()
  @ValidateNested()
  @Type(() => InstagramConfigDto)
  instagram?: InstagramConfigDto


  

  @IsOptional()
  @CleanOptional()
  @IsArray()
  @IsString({ each: true })
  supportMediaType?: string[]
}

/**
 * Template item DTO for individual WhatsApp template
 */
export class TemplateItemDto {
  @IsString()
  @IsNotEmpty({ message: 'WhatsApp template id is required' })
  id!: string

  @IsString()
  @IsNotEmpty({ message: 'WhatsApp template languageCode is required' })
  languageCode!: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  imageUrl?: string

  @IsOptional()
  @CleanOptional()
  @IsObject()
  documents?: { headers?: { type: string; link: string }[]; body?: { type: string; link: string }[] }

  @IsOptional()
  @CleanOptional()
  @IsBoolean({ message: 'isEnabled must be a boolean' })
  isEnabled?: boolean

  @IsString()
  @IsEnum(AppointmentTemplateType, { message: 'Invalid template type' })
  @IsNotEmpty({ message: 'Template type is required' })
  type!: AppointmentTemplateType

  @IsOptional()
  @CleanOptional()
  @IsString()
  templateTitle?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  messageBody?: string

  @IsOptional()
  @CleanOptional()
  @IsArray()
  @IsString({ each: true })
  buttons?: string[]

  @IsOptional()
  @CleanOptional()
  @IsBoolean({ message: 'needToShowOnUI must be a boolean' })
  needToShowOnUI?: boolean

  @IsOptional()
  @CleanOptional()
  @IsArray()
  @IsString({ each: true })
  templateParameters?: string[]

  @IsOptional()
  @CleanOptional()
  @IsArray()
  components?: StoredTemplateComponent[]
}

/**
 * Appointment template DTO for WhatsApp template ID by language
 */
export class AppointmentTemplateDto {
  @IsString()
  @IsEnum(Language, { message: 'Invalid language type' })
  @IsNotEmpty({ message: 'Language is required' })
  language!: Language

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TemplateItemDto)
  @IsNotEmpty({ message: 'Templates are required' })
  templates!: TemplateItemDto[]
}

/**
 * WhatsApp template item DTO for language-agnostic templates
 */
export class WhatsAppTemplateItemDto {
  @IsString()
  @IsNotEmpty({ message: 'WhatsApp template id is required' })
  id!: string

  @IsString()
  @IsNotEmpty({ message: 'WhatsApp template languageCode is required' })
  languageCode!: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  imageUrl?: string

  @IsOptional()
  @CleanOptional()
  @IsObject()
  documents?: { headers?: { type: string; link: string }[]; body?: { type: string; link: string }[] }

  @IsOptional()
  @CleanOptional()
  @IsBoolean({ message: 'isEnabled must be a boolean' })
  isEnabled?: boolean

  @IsString()
  @IsNotEmpty({ message: 'Message body is required' })
  messageBody!: string

  @IsOptional()
  @CleanOptional()
  @IsArray()
  @IsString({ each: true })
  buttons?: string[]

  @IsString()
  @IsNotEmpty({ message: 'Template type is required' })
  type!: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  templateTitle?: string

  @IsOptional()
  @CleanOptional()
  @IsBoolean({ message: 'needToShowOnUI must be a boolean' })
  needToShowOnUI?: boolean

  @IsOptional()
  @CleanOptional()
  @IsArray()
  @IsString({ each: true })
  templateParameters?: string[]

  @IsOptional()
  @CleanOptional()
  @IsArray()
  components?: StoredTemplateComponent[]
}

/**
 * Preview template request DTO
 */
export class PreviewTemplateDto {
  @IsString()
  @IsNotEmpty({ message: 'referenceId is required' })
  referenceId!: string

  @IsString()
  @IsNotEmpty({ message: 'templateType is required' })
  templateType!: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  language?: string
}

/**
 * Organization address DTO
 */
export class OrganizationAddressDto {
  @IsString()
  @IsNotEmpty({ message: 'Address is required' })
  address!: string

  @IsString()
  @IsNotEmpty({ message: 'Map link is required' })
  @IsUrl({}, { message: 'Map link must be a valid URL' })
  mapLink!: string
}

/**
 * Appointment reminder schedule configuration.
 * Allows configuring multiple reminders at different times before an appointment,
 * each with a max send count.
 *
 * Example:
 *   [
 *     { minutesBefore: 1440, isEnabled: true, maxCount: 1 },  // 24hr before, send once
 *     { minutesBefore: 45, isEnabled: true, maxCount: 2 },    // 45min before, send up to 2 times
 *     { minutesBefore: 30, isEnabled: true, maxCount: 1 },    // 30min before, send once
 *   ]
 */
/**
 * Reminder schedule item for organization configuration.
 * Each item specifies WHEN and HOW to send a reminder.
 *
 * @example
 * {
 *   "type": "WHATSAPP",
 *   "offsetMinutes": 30,
 *   "direction": "BEFORE",
 *   "isEnabled": true
 * }
 */
export class ReminderScheduleItemDto {
  @IsString()
  @IsNotEmpty({ message: 'type is required (WHATSAPP, EMAIL, or CALL)' })
  type!: string // 'WHATSAPP' | 'EMAIL' | 'CALL'

  @IsNumber()
  @Min(1, { message: 'offsetMinutes must be at least 1' })
  @IsNotEmpty({ message: 'offsetMinutes is required' })
  offsetMinutes!: number

  @IsString()
  @IsNotEmpty()
  direction!: string // 'BEFORE' | 'AFTER'

  @IsBoolean({ message: 'isEnabled must be a boolean' })
  isEnabled!: boolean
}

export class ReminderConfigDto {
  @IsBoolean()
  autoReminderEnabled!: boolean

  @IsArray()
  @IsString({ each: true })
  reminderTypes!: string[] // ['WHATSAPP', 'EMAIL', 'CALL']

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReminderScheduleItemDto)
  defaultReminderSchedules?: ReminderScheduleItemDto[]
}

export class AppointmentReminderScheduleDto {
  @IsNumber()
  @Min(1, { message: 'minutesBefore must be at least 1' })
  @IsNotEmpty({ message: 'minutesBefore is required' })
  minutesBefore!: number

  @IsBoolean({ message: 'isEnabled must be a boolean' })
  isEnabled!: boolean

  @IsNumber()
  @Min(1, { message: 'maxCount must be at least 1' })
  @IsNotEmpty({ message: 'maxCount is required' })
  maxCount!: number
}

/**
 * Gemini AI configuration
 */
export class GeminiAIConfigurationDto {
  @IsOptional()
  @CleanOptional()
  @IsString()
  apiKey?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  baseUrl?: string
}

/**
 * Create Organization Configuration DTO
 *
 * Used to create a new organization configuration with working hours,
 * social media integrations, and meta attributes.
 */
export class CreateOrganizationConfigurationDto {
  @ValidateNested()
  @Type(() => WorkingHoursDto)
  @IsNotEmpty({ message: 'Working hours is required' })
  workingHours!: WorkingHoursDto

  @IsOptional()
  @CleanOptional()
  @ValidateNested()
  @Type(() => MetaAttributesDto)
  metaAttributes?: MetaAttributesDto

  @IsOptional()
  @CleanOptional()
  @IsArray()
  @IsString({ each: true })
  phoneNumbersId?: string[]

  @IsOptional()
  @CleanOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PhoneNumberInfoDto)
  phoneNumberInformation?: PhoneNumberInfoDto[]

  @IsOptional()
  @CleanOptional()
  @IsArray()
  @ValidateNested({ each: true }) // validates each medicine object
  @Type(() => UploadAudioByLanguageDto) // transforms plain object -> MedicineDto
  public welcomeMessage?: UploadAudioByLanguageDto[]

  @IsOptional()
  @CleanOptional()
  @IsArray()
  @ValidateNested({ each: true }) // validates each medicine object
  @Type(() => UploadTestimonialMessageLanguageDto) // transforms plain object -> MedicineDto
  public testimonialMessage?: UploadTestimonialMessageLanguageDto[]

  @IsOptional()
  @CleanOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AppointmentTemplateDto)
  public appointmentInformation?: AppointmentTemplateDto[]

  @IsOptional()
  @CleanOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WhatsAppTemplateItemDto)
  public whatsappTemplate?: WhatsAppTemplateItemDto[]

  @IsOptional()
  @CleanOptional()
  @ValidateNested()
  @Type(() => OrganizationAddressDto)
  public organizationAddress?: OrganizationAddressDto

  @IsOptional()
  @CleanOptional()
  @ValidateNested()
  @Type(() => ExotelConfigurationDto)
  public exotelConfiguration?: ExotelConfigurationDto

  @IsOptional()
  @CleanOptional()
  @IsBoolean({ message: 'isDeleteAllowed must be a boolean' })
  public isDeleteAllowed?: boolean

  @IsOptional()
  @CleanOptional()
  @IsString()
  public openaiApiKey?: string

  @IsOptional()
  @CleanOptional()
  @ValidateNested()
  @Type(() => GeminiAIConfigurationDto)
  public geminiAIConfiguration?: GeminiAIConfigurationDto

  @IsOptional()
  @CleanOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AppointmentReminderScheduleDto)
  public appointmentReminderSchedules?: AppointmentReminderScheduleDto[]

  @IsOptional()
  @CleanOptional()
  @ValidateNested()
  @Type(() => ReminderConfigDto)
  public reminderConfig?: ReminderConfigDto

  @IsOptional()
  @CleanOptional()
  @ValidateNested()
  @Type(() => TaskNotificationConfigDto)
  public taskNotificationConfig?: TaskNotificationConfigDto

  @IsOptional()
  @CleanOptional()
  @IsString()
  @IsEnum(Language, { message: 'Invalid defaultLanguage' })
  public defaultLanguage?: Language
}
