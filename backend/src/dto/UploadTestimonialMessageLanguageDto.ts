import { IsEnum, IsNotEmpty, IsString, IsUrl, Validate, ValidateIf } from 'class-validator'
import { Language, TestimonialType } from '../typings'
import { MediaUrlExtensionConstraint } from '../utils'

/**
 * DTO for uploading audio files to WhatsApp by language
 * The audio file should already be uploaded to S3 and a public URL provided
 */
export class UploadTestimonialMessageLanguageDto {
  @IsString()
  @IsEnum(Language, { message: 'Invalid language type' })
  @IsNotEmpty({ message: 'Language is required' })
  language!: Language

  @ValidateIf(o => o.type !== TestimonialType.text)
  @IsUrl({}, { message: 'Public URL must be a valid URL' })
  @IsNotEmpty({ message: 'Public URL is required' })
  @Validate(MediaUrlExtensionConstraint)
  publicUrl!: string

  @IsEnum(TestimonialType, { message: 'Invalid type' })
  @IsNotEmpty()
  type!: TestimonialType

  @ValidateIf(o => o.type === TestimonialType.text)
  @IsString()
  body?: string
}
