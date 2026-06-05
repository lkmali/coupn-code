import { IsEnum, IsNotEmpty, IsString, IsUrl, Matches } from 'class-validator'
import { Language } from '../typings'

/**
 * DTO for uploading audio files to WhatsApp by language
 * The audio file should already be uploaded to S3 and a public URL provided
 */
export class UploadAudioByLanguageDto {
  @IsString()
  @IsEnum(Language, { message: 'Invalid language type' })
  @IsNotEmpty({ message: 'Language is required' })
  language!: Language

  @IsUrl({}, { message: 'Audio public URL must be a valid URL' })
  @IsNotEmpty({ message: 'Audio public URL is required' })
  @Matches(/\.mp3(\?.*)?$/, { message: 'Audio public URL must be an MP3 file URL' })
  audioPublicUrl!: string
}
