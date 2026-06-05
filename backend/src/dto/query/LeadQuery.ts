import { IsOptional, IsString, IsEnum, IsIn, IsInt, Min, IsBoolean, IsDateString } from 'class-validator'
import { LeadStatus, SortingOrder } from '../../typings'
import { CleanOptional } from '../../decorators'

export class LeadQuery {
  @IsOptional()
  @CleanOptional()
  @IsInt()
  @Min(0)
  skip?: number

  @IsOptional()
  @CleanOptional()
  @IsInt()
  @Min(1)
  limit: number = 25


  @IsOptional()
  @CleanOptional()
  @IsInt()
  @Min(0)
  pageNumber: number=0

  @IsOptional()
  @CleanOptional()
  @IsString()
  @IsEnum(SortingOrder, {
    message: 'OrderBy can only be ASC or DESC',
  })
  orderBy?: string = SortingOrder.DESC

  @IsOptional()
  @CleanOptional()
  @IsString()
  sortBy?: string = 'createdAt'

  @IsOptional()
  @CleanOptional()
  @IsString()
  search?: string

   @IsOptional()
  @CleanOptional()
  @IsString()
  searchBy?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  referenceId?: string

  @IsOptional()
  @CleanOptional()
  @IsBoolean()
  alreadyCalled?: boolean

  @IsOptional()
  @CleanOptional()
  @IsBoolean()
  requiredFollowup?: boolean

  @IsOptional()
  @CleanOptional()
  @IsEnum(LeadStatus, {
    message: 'Status should be valid like NEW, NOT_PICKUP, NOT_INTERESTED, FOLLOW_UP, CONVERTED, DROPPED, DEACTIVATED',
  })
  status?: string

  // Source is an org-configurable master-data value, so accept any string.
  @IsOptional()
  @CleanOptional()
  @IsString()
  public source?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  adId?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  assignUserId?: string

  @IsOptional()
  @CleanOptional()
  @IsBoolean()
  unreadMessages?: boolean

  @IsOptional()
  @CleanOptional()
  @IsBoolean()
  unreadEmails?: boolean

  @IsOptional()
  @CleanOptional()
  @IsBoolean()
  hasMissedCall?: boolean

  @IsOptional()
  @CleanOptional()
  @IsBoolean()
  isOverdue?: boolean

  @IsOptional()
  @CleanOptional()
  @IsBoolean()
  todayFollowUp?: boolean

  @IsOptional()
  @CleanOptional()
  @IsBoolean()
  todayOverDueFollowUp?: boolean

  // Copilot "today's leads" shortcut. When true, getLeadListForAgent applies a
  // createdAt window from start-of-day to end-of-day (IST) at the DB level — see
  // the prompt's QUICK INTENT MAP. Explicit startDate/endDate take precedence.
  @IsOptional()
  @CleanOptional()
  @IsBoolean()
  createdToday?: boolean

   @IsOptional()
  @CleanOptional()
  @IsDateString()
  startDate?: string

  @IsOptional()
  @CleanOptional()
  @IsDateString()
  endDate?: string

  // Which date field the startDate/endDate window applies to. When omitted, the
  // range matches createdAt OR lastActivityAt OR currentAppointment (see getLeadList).
  @IsOptional()
  @CleanOptional()
  @IsString()
  @IsIn(['createdAt', 'updatedAt'], { message: 'dateField can only be createdAt or updatedAt' })
  dateField?: 'createdAt' | 'updatedAt'

}
