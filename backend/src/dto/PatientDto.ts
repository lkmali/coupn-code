import { IsEnum, IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, Matches } from 'class-validator'
import { TemplateName } from '../typings'
import { CleanOptional } from '../decorators'

// The "Add Record" modal supports PDF, JPG, PNG only. The presigned S3 URL is
// signed with this exact Content-Type, so constraining it here is what actually
// prevents arbitrary uploads — without this guard a malicious client could ask
// for a URL pre-signed for application/x-msdownload and upload anything.
export const ALLOWED_REPORT_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
] as const

const ALLOWED_REPORT_EXT_REGEX = /\.(pdf|jpe?g|png)$/i

export class AssignDoctorDto {
  @IsString()
  @IsNotEmpty()
  public doctorId!: string
}

export class SendPatientEmailDto {
  @IsEnum(TemplateName)
  @IsNotEmpty()
  public emailTemplate!: TemplateName

  @IsString()
  @IsNotEmpty()
  public subject!: string

  @IsString()
  @IsNotEmpty()
  public body!: string
}

export class SendPatientReminderDto {
  @IsString()
  @IsNotEmpty()
  public message!: string

  @IsString()
  @IsOptional()
  @CleanOptional()
  public reminderType?: string
}

export class GetReportUploadUrlDto {
  @IsString()
  @IsNotEmpty()
  @Matches(ALLOWED_REPORT_EXT_REGEX, {
    message: 'fileName must end with .pdf, .jpg, .jpeg, or .png',
  })
  public fileName!: string

  @IsString()
  @IsNotEmpty()
  @IsIn(ALLOWED_REPORT_MIME_TYPES as unknown as string[], {
    message: 'contentType must be one of application/pdf, image/jpeg, image/jpg, image/png',
  })
  public contentType!: string

  @IsString()
  @IsOptional()
  @CleanOptional()
  public reportType?: string

  @IsString()
  @IsOptional()
  @CleanOptional()
  public description?: string
}

export class ConfirmReportUploadDto {
  @IsString()
  @IsNotEmpty()
  public keyId!: string

  @IsString()
  @IsNotEmpty()
  public reportType!: string

  @IsString()
  @IsOptional()
  @CleanOptional()
  public description?: string

  @IsString()
  @IsOptional()
  @CleanOptional()
  public doctorId?: string

  @IsString()
  @IsOptional()
  @CleanOptional()
  public timelineId?: string

  @IsString()
  @IsOptional()
  @CleanOptional()
  public fileName?: string

  @IsString()
  @IsOptional()
  @CleanOptional()
  public reportDate?: string

  @IsString()
  @IsOptional()
  @CleanOptional()
  public activityId?: string

  @IsString()
  @IsOptional()
  @CleanOptional()
  public visitId?: string

  @IsString()
  @IsOptional()
  @CleanOptional()
  public taskId?: string

  @IsEnum(['public', 'private'])
  @IsOptional()
  @CleanOptional()
  public visibility?: 'public' | 'private'
}

export class PatientPaginationQuery {
  @IsOptional()
  @CleanOptional()
  @IsNumber()
  page?: number

  @IsOptional()
  @CleanOptional()
  @IsNumber()
  limit?: number

  @IsOptional()
  @CleanOptional()
  @IsString()
  search?: string
}

export class PatientListQueryDto {
  @IsOptional()
  @CleanOptional()
  @IsNumber()
  skip?: number

  @IsOptional()
  @CleanOptional()
  @IsNumber()
  limit?: number

  @IsOptional()
  @CleanOptional()
  @IsString()
  orderBy?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  sortBy?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  search?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  stage?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  gender?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  maritalStatus?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  assignDoctorId?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  source?: string

  // Exact-match lookup by the human-friendly patient number (auto-incremented per org).
  // Lets the FE Patient-ID search resolve "45" → patient document → _id without
  // sending raw numbers into ObjectId-typed filters elsewhere (e.g. /api/task?patientId=).
  @IsOptional()
  @CleanOptional()
  @IsNumber()
  patientNumber?: number
}
