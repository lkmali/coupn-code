import {
  IsNotEmpty,
  IsString,
  IsObject,
  IsOptional,
  ValidateNested,
  IsArray,
  IsEnum,
  IsBoolean,
} from 'class-validator'
import { Type } from 'class-transformer'
import { CleanOptional } from '../decorators'
import { Language } from '../typings'
import { StoredTemplateComponent } from '../typings/model'
import { ExotelConfigurationDto } from './ExotelDto'



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
  @IsString()
  public openaiModel?: string

  @IsOptional()
  @CleanOptional()
  @ValidateNested()
  @Type(() => GeminiAIConfigurationDto)
  public geminiAIConfiguration?: GeminiAIConfigurationDto


  @IsOptional()
  @CleanOptional()
  @IsString()
  @IsEnum(Language, { message: 'Invalid defaultLanguage' })
  public defaultLanguage?: Language
}
