import { IsOptional, IsString, IsBoolean, IsInt, IsIn, Min, Max } from 'class-validator'
import { Type } from 'class-transformer'
import { CleanOptional } from '../../decorators'

export class GetAppointmentQueryDto {
  // Status is normalized in the service (display labels like "In Progress",
  // case variants, and the PENDING/NOT_STARTED equivalence are all handled there),
  // so we accept any string here instead of pinning to one enum.
  @IsOptional()
  @CleanOptional()
  @IsString()
  status?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  public patientId?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  public doctorId?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  public leadId?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  appointmentDate?: string

  // Range filter on the appointment's `startDate`. When both are supplied
  // they form a [startDate, endDate] window; either alone is a half-open
  // bound. Coexists with `appointmentDate` (single-day) — startDate/endDate
  // wins when both are present.
  @IsOptional()
  @CleanOptional()
  @IsString()
  startDate?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  endDate?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  referenceId?: string

  @IsOptional()
  @CleanOptional()
  @IsBoolean()
  needAllTimeList?: boolean = false

  // ── Pagination / sort / search ────────────────────────────────
  @IsOptional()
  @CleanOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number

  @IsOptional()
  @CleanOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number

  // Whitelisted so callers can't sort by arbitrary Mongo paths.
  // `appointmentDate` / `appointmentTime` are accepted as friendly aliases for
  // `startDate` (the underlying schema field).
  @IsOptional()
  @CleanOptional()
  @IsIn([
    'createdAt', 'updatedAt', 'dueDate', 'priority', 'status', 'title', 'completedDate', 'taskNumber',
    'startDate', 'endDate', 'appointmentDate', 'appointmentTime',
  ])
  sortBy?: string

  @IsOptional()
  @CleanOptional()
  @IsIn(['ASC', 'DESC', 'asc', 'desc'])
  orderBy?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  search?: string

  // Scopes which fields `search` matches against. Mirrors the Scheduling
  // tab's search-category dropdown.
  @IsOptional()
  @CleanOptional()
  @IsIn(['all', 'name', 'phone', 'id'])
  searchBy?: 'all' | 'name' | 'phone' | 'id'

  // When true the response includes a `counts` block with
  // { all, scheduled, cancelled } in a single $facet round-trip. Drives
  // the Scheduling > Appointments stat cards.
  @IsOptional()
  @CleanOptional()
  @IsBoolean()
  includeCounts?: boolean

  @IsOptional()
  @CleanOptional()
  @IsString()
  priority?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  category?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  assignToUserId?: string

  // ── Module-registry routing filters ───────────────────────────
  // Lets a tab or module-scoped view fetch just its own tasks, e.g. ?moduleKey=ivf&sectionKey=opu&refId=<cycleId>.
  @IsOptional()
  @CleanOptional()
  @IsString()
  moduleKey?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  sectionKey?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  refId?: string

  // Scopes the task list to a single flow: 'TREATMENT' for regular treatment
  // runs, 'IPD' for admission tasks. Backed by the
  // { patientId, treatmentCategory, status } compound index on Task.
  @IsOptional()
  @CleanOptional()
  @IsString()
  treatmentCategory?: string

  // Stat-card driven facet for the Task Management header. 'overdue' / 'urgent'
  // don't map to a single status, so the cards send this instead of `status`;
  // resolved in TasksService.applyScopeAndDateFilters. 'all' is a no-op.
  @IsOptional()
  @CleanOptional()
  @IsIn(['all', 'today', 'overdue', 'urgent', 'pending'])
  scope?: string

  // ── Task list date-range filter ───────────────────────────────
  // Which date column the [dateFrom, dateTo] window is matched against.
  // Drives the Task Management "DATE RANGE" filter (and, since the list and
  // dashboard stat cards share buildTaskFilter, the card counts too).
  @IsOptional()
  @CleanOptional()
  @IsIn(['createdAt', 'updatedAt', 'dueDate', 'completedDate'])
  dateField?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  dateFrom?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  dateTo?: string
}
