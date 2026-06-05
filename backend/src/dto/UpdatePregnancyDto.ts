import { IsOptional, IsString, IsIn, IsNumber } from 'class-validator'
import { CleanOptional } from '../decorators'

export class UpdatePregnancyDto {
  @IsOptional()
  @CleanOptional()
  @IsIn(['NORMAL', 'HIGH_RISK', 'TWIN', 'IVF'])
  pregnancyType?: string

  @IsOptional()
  @CleanOptional()
  @IsNumber()
  gravida?: number

  @IsOptional()
  @CleanOptional()
  @IsNumber()
  para?: number

  @IsOptional()
  @CleanOptional()
  @IsString()
  bloodGroup?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  rhFactor?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  assignedDoctorId?: string

  @IsOptional()
  @CleanOptional()
  @IsIn(['ACTIVE', 'DELIVERED', 'MISCARRIAGE', 'TERMINATED', 'ECTOPIC'])
  status?: string
}
