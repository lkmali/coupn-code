import { IsNotEmpty, IsOptional, IsString, IsIn } from 'class-validator'
import { CleanOptional } from '../decorators'

export class CreateIVFCycleDto {
  @IsNotEmpty()
  @IsString()
  patientId!: string

  @IsNotEmpty()
  @IsIn(['SELF', 'OVUM_DONOR', 'SPERM_DONOR', 'EMBRYO_DONOR', 'SELF_PLUS_DONOR'])
  cycleType!: string

  // Optional in the payload — the service derives it from the resolved SOP's
  // treatmentType (`IVF` or `EGG_FREEZING`). Accepted here so the FE can echo
  // the kind back for clarity, but it's not authoritative.
  @IsOptional()
  @CleanOptional()
  @IsIn(['IVF', 'EGG_FREEZING'])
  cycleKind?: string

  // Required when cycleKind resolves to EGG_FREEZING. Validated in the service
  // (class-validator can't express "required if X").
  @IsOptional()
  @CleanOptional()
  @IsIn(['OOCYTE_ONLY', 'EMBRYO'])
  freezeTarget?: string

  @IsNotEmpty()
  @IsString()
  protocolType!: string

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
  @IsString()
  sopTreatmentTypeId?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  donorId?: string
}
