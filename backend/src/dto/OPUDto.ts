import { IsNotEmpty, IsOptional, IsDateString, IsNumber, IsString } from 'class-validator'
import { Type } from 'class-transformer'
import { CleanOptional } from '../decorators'

export class OPUDto {
  @IsNotEmpty()
  @IsDateString()
  date!: string

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  totalOocytes!: number

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  matureOocytes!: number

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  immatureOocytes!: number

  @IsOptional()
  @CleanOptional()
  @Type(() => Number)
  @IsNumber()
  abnormalOocytes?: number

  @IsOptional()
  @CleanOptional()
  @IsString()
  performedBy?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  anesthesiaType?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  complications?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  notes?: string
}
