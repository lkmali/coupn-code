import { IsNotEmpty, IsString } from 'class-validator'

export class MissedAppointmentDto {
  @IsString()
  @IsNotEmpty({ message: 'Username is required' })
  public username!: string

  @IsString()
  @IsNotEmpty({ message: 'Appointment type is required' })
  public appointmentType!: string

  @IsString()
  @IsNotEmpty({ message: 'Date is required' })
  public date!: string

  @IsString()
  @IsNotEmpty({ message: 'Time is required' })
  public time!: string
}
