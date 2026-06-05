import { IsOptional, IsString, IsNumber, IsArray, IsDateString, IsIn } from 'class-validator'
import { Type } from 'class-transformer'
import { CleanOptional } from '../decorators'

/** Full-replace payload for `embryology`. All fields optional. */
export class UpdateEmbryologyDto {
  @IsOptional()
  @CleanOptional()
  @IsIn(['IVF', 'ICSI', 'SPLIT', 'MIXED'])
  fertilizationMethod?: string

  @IsOptional()
  @CleanOptional()
  @IsDateString()
  fertilizationDate?: string

  @IsOptional()
  @CleanOptional()
  @Type(() => Number)
  @IsNumber()
  oocytesInseminated?: number

  @IsOptional()
  @CleanOptional()
  @Type(() => Number)
  @IsNumber()
  fertilizationCount?: number

  @IsOptional()
  @CleanOptional()
  @Type(() => Number)
  @IsNumber()
  fertilizationRate?: number

  @IsOptional()
  @CleanOptional()
  @Type(() => Number)
  @IsNumber()
  totalFertilized?: number

  @IsOptional()
  @CleanOptional()
  @Type(() => Number)
  @IsNumber()
  totalEmbryos?: number

  @IsOptional()
  @CleanOptional()
  @Type(() => Number)
  @IsNumber()
  day5Blastocysts?: number

  @IsOptional()
  @CleanOptional()
  @Type(() => Number)
  @IsNumber()
  frozen?: number

  @IsOptional()
  @CleanOptional()
  @Type(() => Number)
  @IsNumber()
  transferred?: number

  @IsOptional()
  @CleanOptional()
  @Type(() => Number)
  @IsNumber()
  twoPN?: number

  @IsOptional()
  @CleanOptional()
  @Type(() => Number)
  @IsNumber()
  threePN?: number

  @IsOptional()
  @CleanOptional()
  @Type(() => Number)
  @IsNumber()
  onePN?: number

  @IsOptional()
  @CleanOptional()
  @Type(() => Number)
  @IsNumber()
  zeroPN?: number

  @IsOptional()
  @CleanOptional()
  @Type(() => Number)
  @IsNumber()
  excellentGrade?: number

  @IsOptional()
  @CleanOptional()
  @Type(() => Number)
  @IsNumber()
  goodGrade?: number

  @IsOptional()
  @CleanOptional()
  @Type(() => Number)
  @IsNumber()
  fairGrade?: number

  @IsOptional()
  @CleanOptional()
  @IsArray()
  embryos?: any[]

  @IsOptional()
  @CleanOptional()
  @IsString()
  notes?: string
}
