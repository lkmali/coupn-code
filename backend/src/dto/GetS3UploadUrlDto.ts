import { IsNotEmpty, IsString } from 'class-validator'

export class GetS3UploadUrlDto {
  @IsString()
  @IsNotEmpty()
  filename!: string

  @IsString()
  @IsNotEmpty()
  contentType!: string
}
