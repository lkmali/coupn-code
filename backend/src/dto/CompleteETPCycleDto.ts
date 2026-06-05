import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator'
import { CleanOptional } from '../decorators'

export class CompleteETPCycleDto {
  @IsNotEmpty()
  @IsIn(['Completed', 'Cancelled'])
  outcome!: 'Completed' | 'Cancelled'

  @IsOptional()
  @CleanOptional()
  @IsString()
  notes?: string
}
