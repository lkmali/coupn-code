import { IsNotEmpty, IsOptional, IsDateString, IsNumber, IsString, IsIn, IsBoolean } from 'class-validator'
import { Type } from 'class-transformer'
import { CleanOptional } from '../decorators'

export class IVFOutcomeDto {
  @IsNotEmpty()
  @IsDateString()
  pregnancyTestDate!: string

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  betaHcgValue!: number

  @IsNotEmpty()
  @IsIn(['POSITIVE', 'NEGATIVE', 'CHEMICAL_PREGNANCY'])
  result!: string

  @IsOptional()
  @CleanOptional()
  @IsBoolean()
  clinicalPregnancy?: boolean

  @IsOptional()
  @CleanOptional()
  @IsString()
  notes?: string
}
