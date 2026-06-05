import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator'
import { AppointmentStatus } from '../typings'
import { CleanOptional } from '../decorators'

export class UpdateAppointmentStatusDto {
  @IsEnum(AppointmentStatus)
  @IsNotEmpty()
  public status!: AppointmentStatus

  @IsOptional()
  @CleanOptional()
  @IsString()
  public comment?: string
}
