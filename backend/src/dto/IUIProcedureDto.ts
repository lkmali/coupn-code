import { IsNotEmpty, IsOptional, IsString, IsDateString, IsIn, IsNumber } from 'class-validator'
import { CleanOptional } from '../decorators'

export class IUIProcedureDto {
  @IsNotEmpty()
  @IsDateString()
  procedureDate!: string

  @IsNotEmpty()
  @IsIn(['SINGLE', 'DOUBLE'])
  technique!: string

  @IsNotEmpty()
  @IsIn(['HUSBAND', 'DONOR'])
  inseminationType!: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  procedureTime?: string

  @IsOptional()
  @CleanOptional()
  @IsNumber()
  prewashCount?: number

  @IsOptional()
  @CleanOptional()
  @IsNumber()
  prewashMotility?: number

  @IsOptional()
  @CleanOptional()
  @IsNumber()
  postwashCount?: number

  @IsOptional()
  @CleanOptional()
  @IsNumber()
  postwashMotility?: number

  @IsOptional()
  @CleanOptional()
  @IsString()
  catheterType?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  donorId?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  performedBy?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  notes?: string
}
