import { IsOptional, IsString, IsNumber, IsArray, IsDateString, IsIn, IsObject } from 'class-validator'
import { Type } from 'class-transformer'
import { CleanOptional } from '../decorators'

/**
 * Create or fully replace a single transfer entry. `transfer.transfers[]`
 * in the cycle is an ordered list — use the cycleId + transferId to update.
 */
export class TransferItemDto {
  @IsOptional()
  @CleanOptional()
  @Type(() => Number)
  @IsNumber()
  transferNumber?: number

  @IsOptional()
  @CleanOptional()
  @IsDateString()
  date?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  time?: string

  @IsOptional()
  @CleanOptional()
  @IsIn(['Completed', 'Ongoing', 'Failed'])
  status?: string

  @IsOptional()
  @CleanOptional()
  @IsIn(['Fresh', 'Frozen'])
  transferType?: string

  /**
   * Per-transfer clinical details. Kept as a plain object (not a nested
   * class) so the same endpoint accepts partial updates without having to
   * re-send every field.
   */
  @IsOptional()
  @CleanOptional()
  @IsObject()
  details?: Record<string, any>

  @IsOptional()
  @CleanOptional()
  @IsArray()
  medications?: string[]

  @IsOptional()
  @CleanOptional()
  @IsString()
  notes?: string
}
