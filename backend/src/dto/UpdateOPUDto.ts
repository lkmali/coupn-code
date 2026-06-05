import { IsOptional, IsString, IsNumber, IsArray, IsDateString } from 'class-validator'
import { Type } from 'class-transformer'
import { CleanOptional } from '../decorators'

/** Full-replace payload for `opu`. All fields optional. */
export class UpdateOPUDto {
  @IsOptional()
  @CleanOptional()
  @IsDateString()
  procedureDate?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  procedureTime?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  anesthesia?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  anesthesiaType?: string

  @IsOptional()
  @CleanOptional()
  @Type(() => Number)
  @IsNumber()
  duration?: number

  @IsOptional()
  @CleanOptional()
  @IsString()
  performedBy?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  embryologistId?: string

  @IsOptional()
  @CleanOptional()
  @Type(() => Number)
  @IsNumber()
  folliclesAspirated?: number

  @IsOptional()
  @CleanOptional()
  @Type(() => Number)
  @IsNumber()
  oocytesRetrieved?: number

  @IsOptional()
  @CleanOptional()
  @Type(() => Number)
  @IsNumber()
  matureOocytes?: number

  @IsOptional()
  @CleanOptional()
  @Type(() => Number)
  @IsNumber()
  immatureOocytes?: number

  @IsOptional()
  @CleanOptional()
  @Type(() => Number)
  @IsNumber()
  miOocytes?: number

  @IsOptional()
  @CleanOptional()
  @Type(() => Number)
  @IsNumber()
  gvOocytes?: number

  @IsOptional()
  @CleanOptional()
  @Type(() => Number)
  @IsNumber()
  abnormalOocytes?: number

  @IsOptional()
  @CleanOptional()
  @IsString()
  fertilizationMethod?: string

  @IsOptional()
  @CleanOptional()
  @IsArray()
  pickups?: any[]

  @IsOptional()
  @CleanOptional()
  @IsString()
  complications?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  notes?: string
}
