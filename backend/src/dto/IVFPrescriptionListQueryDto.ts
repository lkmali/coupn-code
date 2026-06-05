import { IsOptional, IsString, IsNumber, IsIn } from 'class-validator'
import { Type } from 'class-transformer'
import { CleanOptional } from '../decorators'

export class IVFPrescriptionListQueryDto {
  @IsOptional()
  @CleanOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1

  @IsOptional()
  @CleanOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 50

  @IsOptional()
  @CleanOptional()
  @IsIn(['stimulation', 'opu', 'embryology', 'etp', 'transfer', 'outcome'])
  stage?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  patientId?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  prescribedBy?: string
}
