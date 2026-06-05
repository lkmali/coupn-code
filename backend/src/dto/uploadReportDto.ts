import { IsOptional, IsString } from 'class-validator'

export class UploadedFileDto {
  @IsOptional()
  @IsString()
  public doctorName!: string

  @IsOptional()
  @IsString()
  public patientId!: string

  @IsOptional()
  @IsString()
  public doctorId!: string

  @IsString()
  public patientName!: string

  @IsString()
  public reportType!: string
}
