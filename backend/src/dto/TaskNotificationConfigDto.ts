import { Type } from 'class-transformer'
import { IsBoolean, IsInt, IsOptional, IsString, Matches, Min, ValidateNested } from 'class-validator'

// enabled + how-many-times-to-send (maxCount). Used for assignment alerts.
class ToggleMaxDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxCount?: number
}

class DailyDigestDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean

  // Org-local time-of-day to fire the morning digest, 'HH:mm' (24h).
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'time must be in HH:mm (24h) format' })
  time?: string
}

// enabled + daily send time + how-many-times-to-send. Used for the due-today nudge.
class DueTodayDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean

  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'time must be in HH:mm (24h) format' })
  time?: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxCount?: number
}

class PreTaskReminderDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  leadMinutes?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxCount?: number
}

class OverdueEscalationDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  thresholdMinutes?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxCount?: number
}

// SuperAdmin-managed per-org WhatsApp task-notification settings. All fields optional — the update is
// a deep-merge over the stored config, and TaskNotificationService applies defaults for anything unset.
// SETTINGS ONLY — runtime "how many sent" counts live per task at task.notificationsSent.counts.
export class TaskNotificationConfigDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean

  @IsOptional()
  @ValidateNested()
  @Type(() => ToggleMaxDto)
  assignmentAlert?: ToggleMaxDto

  @IsOptional()
  @ValidateNested()
  @Type(() => DailyDigestDto)
  dailyDigest?: DailyDigestDto

  @IsOptional()
  @ValidateNested()
  @Type(() => DueTodayDto)
  dueToday?: DueTodayDto

  @IsOptional()
  @ValidateNested()
  @Type(() => PreTaskReminderDto)
  preTaskReminder?: PreTaskReminderDto

  @IsOptional()
  @ValidateNested()
  @Type(() => OverdueEscalationDto)
  overdueEscalation?: OverdueEscalationDto

  // IANA timezone for digest/due-today day boundaries (e.g. 'Asia/Kolkata').
  @IsOptional()
  @IsString()
  timezone?: string
}
