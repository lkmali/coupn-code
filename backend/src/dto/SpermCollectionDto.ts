import { IsNotEmpty, IsOptional, IsDateString, IsNumber, IsString, IsIn, Min } from 'class-validator'
import { Type } from 'class-transformer'
import { CleanOptional } from '../decorators'

export class SpermCollectionDto {
  @IsNotEmpty()
  @IsDateString()
  date!: string

  @IsNotEmpty()
  @IsIn(['EJACULATE', 'TESA', 'PESA', 'DONOR', 'FREEZE', 'FROZEN'])
  source!: string

  // Source of THIS analysis record — same axis as opuSourceType on the
  // OPU pickup. FRESH = sample collected now; FROZEN = thawed from a
  // sperm_batches doc (sourceBatchId required); DONOR = drawn from the
  // ART bank (sourceDonorId required).
  @IsOptional()
  @CleanOptional()
  @IsIn(['FRESH', 'FROZEN', 'DONOR'])
  sourceType?: 'FRESH' | 'FROZEN' | 'DONOR'

  @IsOptional()
  @CleanOptional()
  @IsString()
  sourceBatchId?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  sourceDonorId?: string

  @IsOptional()
  @CleanOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  consumedQty?: number

  @IsOptional()
  @CleanOptional()
  @IsString()
  donorId?: string

  @IsOptional()
  @CleanOptional()
  @Type(() => Number)
  @IsNumber()
  prewashCount?: number

  @IsOptional()
  @CleanOptional()
  @Type(() => Number)
  @IsNumber()
  prewashMotility?: number

  @IsOptional()
  @CleanOptional()
  @Type(() => Number)
  @IsNumber()
  postwashCount?: number

  @IsOptional()
  @CleanOptional()
  @Type(() => Number)
  @IsNumber()
  postwashMotility?: number

  @IsOptional()
  @CleanOptional()
  @Type(() => Number)
  @IsNumber()
  morphology?: number

  @IsOptional()
  @CleanOptional()
  @IsString()
  notes?: string
}
