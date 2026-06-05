import { IsEnum, IsOptional, IsString } from 'class-validator'
import { CleanOptional } from '../../decorators'

export class GetAppointmentAgentDto {
  @IsOptional()
  @CleanOptional()
  @IsString()
  public patientId?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  public doctorId?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  public referenceId?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  public patientName?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  public doctorName?: string

  @IsOptional()
  @CleanOptional()
  @IsEnum(['PENDING', 'COMPLETED', 'CANCELLED'], {
    message: 'Status must be PENDING, COMPLETED, or CANCELLED',
  })
  public status?: 'PENDING' | 'COMPLETED' | 'CANCELLED'
}
