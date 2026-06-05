import { IsOptional, IsString } from 'class-validator'
import { CleanOptional } from '../../decorators'
import { IsAtLeastOneOf } from '../validators'

export class CancelAppointmentAgentDto {
  @IsOptional()
  @CleanOptional()
  @IsString()
  @IsAtLeastOneOf(['appointmentId', 'referenceId'])
  public appointmentId?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  public referenceId?: string



  @IsOptional()
  @CleanOptional()
  @IsString()
  public source?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  public reason?: string
}
