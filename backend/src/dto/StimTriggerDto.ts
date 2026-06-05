import { IsNotEmpty, IsString, IsDateString } from 'class-validator'

export class StimTriggerDto {
  @IsNotEmpty()
  @IsDateString()
  date!: string

  @IsNotEmpty()
  @IsString()
  medication!: string

  @IsNotEmpty()
  @IsString()
  dosage!: string

  @IsNotEmpty()
  @IsString()
  triggerTime!: string
}
