import { IsDateString, IsOptional, IsString } from 'class-validator'
import { CleanOptional } from '../decorators'

export class UpdateFollowUpDto {
  @IsOptional()
  @CleanOptional()
  @IsDateString()
  followUpDate?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  notes?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  status?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  assignToUserId?: string
}
