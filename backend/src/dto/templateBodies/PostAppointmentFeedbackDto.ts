import { IsNotEmpty, IsString } from 'class-validator'

export class PostAppointmentFeedbackDto {
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  public name!: string
}
