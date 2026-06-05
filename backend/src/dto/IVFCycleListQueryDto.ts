import { IsOptional, IsString, IsNumber } from 'class-validator'
import { Type } from 'class-transformer'
import { CleanOptional } from '../decorators'

export class IVFCycleListQueryDto {
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
  patientId?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  status?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  cycleType?: string

  // Filters by cycleKind ('IVF' or 'EGG_FREEZING'). Drives the Egg Freezing
  // dashboard's cycle list — pass 'EGG_FREEZING' to scope to that surface.
  @IsOptional()
  @CleanOptional()
  @IsString()
  cycleKind?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  search?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  assignedDoctorId?: string
}
