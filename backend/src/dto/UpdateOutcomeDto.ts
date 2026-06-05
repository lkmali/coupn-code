import { IsOptional, IsString, IsNumber, IsBoolean, IsDateString, IsIn } from 'class-validator'
import { Type } from 'class-transformer'
import { CleanOptional } from '../decorators'

/** Full-replace payload for `outcome`. All fields optional — partial merge supported. */
export class UpdateOutcomeDto {
  @IsOptional()
  @CleanOptional()
  @IsDateString()
  pregnancyTestDate?: string

  @IsOptional()
  @CleanOptional()
  @Type(() => Number)
  @IsNumber()
  daysPostTransfer?: number

  @IsOptional()
  @CleanOptional()
  @Type(() => Number)
  @IsNumber()
  betaHcgValue?: number

  @IsOptional()
  @CleanOptional()
  @IsIn(['POSITIVE', 'NEGATIVE', 'BIOCHEMICAL', 'ECTOPIC', 'PENDING', 'CHEMICAL_PREGNANCY'])
  result?: string

  @IsOptional()
  @CleanOptional()
  @Type(() => Number)
  @IsNumber()
  progesterone?: number

  @IsOptional()
  @CleanOptional()
  @IsDateString()
  secondBetaHcgDate?: string

  @IsOptional()
  @CleanOptional()
  @Type(() => Number)
  @IsNumber()
  secondBetaHcgValue?: number

  @IsOptional()
  @CleanOptional()
  @IsDateString()
  firstUltrasoundDate?: string

  @IsOptional()
  @CleanOptional()
  @Type(() => Number)
  @IsNumber()
  gestationalSacsSeen?: number

  @IsOptional()
  @CleanOptional()
  @IsString()
  fetalHeartbeat?: string

  @IsOptional()
  @CleanOptional()
  @Type(() => Number)
  @IsNumber()
  numberOfFetuses?: number

  @IsOptional()
  @CleanOptional()
  @IsBoolean()
  clinicalPregnancy?: boolean

  @IsOptional()
  @CleanOptional()
  @IsString()
  notes?: string
}
