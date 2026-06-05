import { IsNotEmpty, IsOptional, IsString, IsBoolean, IsDateString, IsIn } from 'class-validator'
import { CleanOptional } from '../decorators'

/** Set PGT fields on a specific embryo. */
export class PGTDto {
  @IsOptional()
  @CleanOptional()
  @IsBoolean()
  enabled?: boolean

  @IsOptional()
  @CleanOptional()
  @IsString()
  biopsyDay?: string

  @IsOptional()
  @CleanOptional()
  @IsDateString()
  biopsyDate?: string

  @IsOptional()
  @CleanOptional()
  @IsIn(['PGT-A', 'PGT-M', 'PGT-SR'])
  pgtType?: string

  @IsNotEmpty()
  @IsIn(['Euploid', 'Aneuploid', 'Mosaic', 'No Result'])
  result!: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  clinicalNotes?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  embryoStatus?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  embryoGrade?: string
}
