import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator'
import { CleanOptional } from '../decorators'

export class ConvertLeadToPatient {
  @IsString()
  public notes!: string

  @CleanOptional()
  @IsOptional()
  @IsDateString()
  @IsNotEmpty()
  appointmentDate!: string
}
