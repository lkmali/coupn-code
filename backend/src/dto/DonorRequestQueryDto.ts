import { IsOptional, IsString, IsNumber } from 'class-validator'
import { Type } from 'class-transformer'
import { CleanOptional } from '../decorators'

export class DonorRequestQueryDto {
  @IsOptional()
  @CleanOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1

  @IsOptional()
  @CleanOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 20

  @IsOptional()
  @CleanOptional()
  @IsString()
  status?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  patientId?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  requestType?: string
}
