import { IsOptional, IsString, IsNumber, IsDateString, IsArray, IsIn } from 'class-validator'
import { Type } from 'class-transformer'
import { CleanOptional } from '../decorators'

/** Create or replace an endometrial preparation cycle entry. */
export class ETPCycleDto {
  @IsOptional()
  @CleanOptional()
  @Type(() => Number)
  @IsNumber()
  prepNumber?: number

  @IsOptional()
  @CleanOptional()
  @IsDateString()
  startDate?: string

  @IsOptional()
  @CleanOptional()
  @IsIn(['In Progress', 'Completed', 'Cancelled'])
  status?: string

  @IsOptional()
  @CleanOptional()
  @IsIn(['Hormonal Replacement', 'Natural Cycle', 'Modified Natural', 'Letrozole-based'])
  method?: string

  // Top-level clinical pathway selected on the ETP form. Drives which
  // sub-options the dialog renders dynamically.
  @IsOptional()
  @CleanOptional()
  @IsIn(['MODIFIED_CYCLE', 'NATURAL_CYCLE', 'ETP_CYCLE'])
  preparationType?: 'MODIFIED_CYCLE' | 'NATURAL_CYCLE' | 'ETP_CYCLE'

  @IsOptional()
  @CleanOptional()
  @IsDateString()
  day0Date?: string

  @IsOptional()
  @CleanOptional()
  @IsDateString()
  transferDate?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  baselineThickness?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  baselinePattern?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  estrogenMedication?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  estrogenDosage?: string

  @IsOptional()
  @CleanOptional()
  @IsArray()
  timeline?: any[]

  @IsOptional()
  @CleanOptional()
  @IsString()
  notes?: string
}
