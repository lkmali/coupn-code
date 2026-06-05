import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator'
import { CleanOptional } from '../decorators'

export class CreateFollowUpDto {
  @IsString()
  @IsNotEmpty({ message: 'Lead ID should not be empty' })
  leadId!: string

  @IsDateString()
  @IsNotEmpty({ message: 'Follow up date should not be empty' })
  followUpDate!: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  notes?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  assignToUserId?: string
}
