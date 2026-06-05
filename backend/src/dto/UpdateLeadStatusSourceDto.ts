import { IsEnum, IsOptional, IsString } from 'class-validator'
import { LeadStatus } from '../typings'

export class UpdateLeadStatusSourceDto {
  @IsOptional()
  @IsEnum(LeadStatus, {
    message: 'Status must be one of: NEW, NOT_PICKUP, NOT_INTERESTED, FOLLOW_UP, CONVERTED, DROPPED, DEACTIVATED',
  })
  public status?: LeadStatus

  @IsOptional()
  @IsString()
  public reason?: string

  @IsOptional()
  @IsString()
  public notes?: string
}
