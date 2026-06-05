import { IsString, IsNotEmpty } from 'class-validator'

export class CheckAvailabilityAgentDto {
  @IsString()
  @IsNotEmpty()
  public appointmentDate!: string
}
