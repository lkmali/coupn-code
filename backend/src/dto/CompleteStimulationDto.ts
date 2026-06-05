import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator'
import { CleanOptional } from '../decorators'

export class CompleteStimulationDto {
  @IsNotEmpty()
  @IsIn(['COMPLETED', 'CANCELLED', 'FAILED'])
  outcome!: 'COMPLETED' | 'CANCELLED' | 'FAILED'

  @IsOptional()
  @CleanOptional()
  @IsString()
  notes?: string
}
