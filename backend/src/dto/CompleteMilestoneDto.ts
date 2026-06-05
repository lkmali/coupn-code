import { IsNotEmpty, IsOptional, IsString } from 'class-validator'
import { CleanOptional } from '../decorators'

export class CompleteMilestoneDto {
  @IsNotEmpty()
  @IsString()
  milestoneId!: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  notes?: string
}
