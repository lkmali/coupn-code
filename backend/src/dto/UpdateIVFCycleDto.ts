import { IsOptional, IsString, IsIn } from 'class-validator'
import { CleanOptional } from '../decorators'

export class UpdateIVFCycleDto {
  @IsOptional()
  @CleanOptional()
  @IsIn(['SELF', 'OVUM_DONOR', 'SPERM_DONOR', 'EMBRYO_DONOR', 'SELF_PLUS_DONOR'])
  cycleType?: string

  // freezeTarget can be flipped between OOCYTE_ONLY and EMBRYO post-create
  // (e.g. clinician decides mid-stimulation to make embryos instead). cycleKind
  // itself is immutable once created — switching from IVF to EGG_FREEZING
  // would invalidate timeline/tasks.
  @IsOptional()
  @CleanOptional()
  @IsIn(['OOCYTE_ONLY', 'EMBRYO'])
  freezeTarget?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  protocolType?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  assignedDoctorId?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  embryologistId?: string

  @IsOptional()
  @CleanOptional()
  @IsIn(['PLANNED', 'STIMULATION', 'TRIGGERED', 'OPU_DONE', 'FERTILIZATION', 'POST_ET', 'AWAITING_RESULT', 'COMPLETED', 'CANCELLED'])
  status?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  donorId?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  donorCode?: string
}
