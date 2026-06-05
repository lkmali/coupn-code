import { IsNotEmpty, IsString, IsOptional } from 'class-validator'
import { CleanOptional } from '../decorators'

export class GetMediaUploadUrlDto {
  @IsString()
  @IsNotEmpty()
  fileName!: string

  @IsString()
  @IsNotEmpty()
  contentType!: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  description!: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  category!: string
}

export class ConfirmMediaUploadDto {
  @IsString()
  @IsNotEmpty()
  s3Key!: string

  @IsString()
  @IsNotEmpty()
  fileName!: string

  @IsString()
  @IsNotEmpty()
  contentType!: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  publicUrl!: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  description!: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  category!: string
}

export class DeleteOrgMediaDto {
  @IsString()
  @IsNotEmpty()
  mediaId!: string
}
