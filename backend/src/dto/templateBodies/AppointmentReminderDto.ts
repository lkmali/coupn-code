import { IsString } from 'class-validator'

export class AppointmentReminderDto {
  @IsString()
  public username!: string
}
