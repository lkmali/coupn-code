import { IsOptional, IsString, IsIn, IsDateString } from 'class-validator'
import { CleanOptional } from '../decorators'

export class UpdateIUICycleDto {
  @IsOptional()
  @CleanOptional()
  @IsString()
  protocolType?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  assignedDoctorId?: string

  @IsOptional()
  @CleanOptional()
  @IsIn(['PLANNED', 'MONITORING', 'TRIGGERED', 'INSEMINATED', 'AWAITING_RESULT', 'COMPLETED', 'CANCELLED'])
  status?: string

  @IsOptional()
  @CleanOptional()
  @IsDateString()
  endDate?: string
}
