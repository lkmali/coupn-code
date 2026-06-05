import { IsNotEmpty, IsOptional, IsString, IsDateString } from 'class-validator'
import { CleanOptional } from '../decorators'

export class TriggerDetailsDto {
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

  @IsOptional()
  @CleanOptional()
  @IsDateString()
  ovulationExpectedDate?: string
}
