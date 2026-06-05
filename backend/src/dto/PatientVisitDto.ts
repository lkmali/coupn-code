import { IsOptional, IsString, IsArray, IsNotEmpty, ValidateNested, IsEnum } from 'class-validator'
import { Type } from 'class-transformer'
import { CleanOptional } from '../decorators'
import { PaginationQuery } from './query/PaginationQuery'

export class CheckInDto {
  @IsString()
  @IsNotEmpty()
  leadId!: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  patientId?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  description?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  handledBy?: string
}

export class CheckOutDto {
  @IsOptional()
  @CleanOptional()
  @IsString()
  description?: string
}

export class VisitMedicineDto {
  @IsString()
  @IsNotEmpty()
  name!: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  dosage?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  frequency?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  duration?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  instructions?: string
}

export class UpdateVisitDto {
  @IsOptional()
  @CleanOptional()
  @IsString()
  description?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  handledBy?: string

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VisitMedicineDto)
  medicines?: VisitMedicineDto[]

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  reportIds?: string[]
}

export class ReportUploadUrlDto {
  @IsString()
  @IsNotEmpty()
  fileName!: string

  @IsString()
  @IsNotEmpty()
  contentType!: string
}

export class ConfirmVisitReportUploadDto {
  @IsString()
  @IsNotEmpty()
  keyId!: string

  @IsString()
  @IsNotEmpty()
  reportType!: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  fileName?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  reportDate?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  description?: string

  @IsOptional()
  @CleanOptional()
  @IsEnum(['public', 'private'])
  visibility?: 'public' | 'private'
}

export class GetVisitsQueryDto extends PaginationQuery {
  @IsOptional()
  @CleanOptional()
  @IsString()
  leadId?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  patientId?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  status?: string
}
