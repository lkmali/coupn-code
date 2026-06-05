import { IsOptional, IsString, IsBooleanString } from 'class-validator'
import { PaginationQuery } from '../query/PaginationQuery'
import { CleanOptional } from '../../decorators'

export class PatientTaskQuery extends PaginationQuery {
  @IsOptional()
  @CleanOptional()
  @IsString()
  status?: string
}

export class PatientReportQuery extends PaginationQuery {
  @IsOptional()
  @CleanOptional()
  @IsString()
  reportType?: string
}

export class PatientMedicineQuery extends PaginationQuery {
  @IsOptional()
  @CleanOptional()
  @IsString()
  status?: string
}

export class PatientAppointmentQuery extends PaginationQuery {
  @IsOptional()
  @CleanOptional()
  @IsBooleanString()
  upcoming?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  status?: string
}

export class PatientTimelineQuery extends PaginationQuery {
  @IsOptional()
  @CleanOptional()
  @IsString()
  status?: string
}

export class PatientMedicalHistoryQuery extends PaginationQuery {
  @IsOptional()
  @CleanOptional()
  @IsString()
  recordType?: string
}
