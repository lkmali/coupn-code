import { IsString, IsNotEmpty, IsEnum, IsOptional, IsArray, ValidateNested, IsNumberString } from 'class-validator'
import { Type } from 'class-transformer'
import { IsSafeMessage } from './validators/IsSafeMessage.validator'

export enum BroadcastMediaType {
  IMAGE = 'image',
  AUDIO = 'audio',
  VIDEO = 'video',
  DOCUMENT = 'document',
}

export type WhatsappMediaTypeUnion = 'image' | 'audio' | 'video' | 'document'

export class WhatsappMediaUploadUrlDto {
  @IsEnum(BroadcastMediaType)
  @IsNotEmpty()
  public mediaType!: WhatsappMediaTypeUnion

  @IsString()
  @IsNotEmpty()
  public fileName!: string

    @IsString()
    @IsNotEmpty({ message: 'Mobile number should not be empty' })
    @IsNumberString({}, { message: 'Mobile number must contain only digits' })
   // @IsValidMobileNumber({ message: 'Invalid mobile number format. Must include country code (91, 44, 1, or 971) without + prefix' })
    public mobileNumber!: string
}

export class WhatsappMediaBroadcastDto {
  @IsString()
  @IsNotEmpty()
  public keyId!: string

  @IsEnum(BroadcastMediaType)
  @IsNotEmpty()
  public mediaType!: WhatsappMediaTypeUnion

  @IsOptional()
  @IsString()
  @IsSafeMessage({ message: 'Caption contains unsafe content. Only plain text, emails, and standard characters are allowed.' })
  public caption?: string

  @IsArray()
  @IsString({ each: true })
  public mobileNumbers!: string[]
}

export class MediaFileItem {
  @IsString()
  @IsNotEmpty()
  public keyId!: string

  @IsEnum(BroadcastMediaType)
  @IsNotEmpty()
  public mediaType!: WhatsappMediaTypeUnion

  @IsOptional()
  @IsString()
  @IsSafeMessage({ message: 'Caption contains unsafe content. Only plain text, emails, and standard characters are allowed.' })
  public caption?: string
}

export class WhatsappSendMediaToUserDto {
  @IsString()
  @IsNotEmpty({ message: 'Mobile number should not be empty' })
  @IsNumberString({}, { message: 'Mobile number must contain only digits' })
 // @IsValidMobileNumber({ message: 'Invalid mobile number format. Must include country code (91, 44, 1, or 971) without + prefix' })
  public mobileNumber!: string

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MediaFileItem)
  public mediaFiles!: MediaFileItem[]
}
