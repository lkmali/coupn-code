import { IsNotEmpty, IsDateString } from 'class-validator'

export class StartStimulationDto {
  @IsNotEmpty()
  @IsDateString()
  startDate!: string
}
