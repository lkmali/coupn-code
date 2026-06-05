import {
  IsArray,
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
} from 'class-validator'
import { Type } from 'class-transformer'
import { CleanOptional } from '../decorators'

export class AddPickupDto {
  @IsNotEmpty()
  @IsDateString()
  date!: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  procedureTime?: string

  // Clinical pathway selected at pickup time: ICSI sends oocytes to
  // fertilization, FREEZE sends mature oocytes to the Freezing Program
  // for cryopreservation. Optional for back-compat with older pickups.
  @IsOptional()
  @CleanOptional()
  @IsIn(['ICSI', 'FREEZE'])
  pickupType?: 'ICSI' | 'FREEZE'

  // Origin of oocytes used in this pickup. FRESH gates on stim completed;
  // FROZEN consumes from an ivf_oocyte_batches doc; DONOR consumes from
  // an ART-bank Donor (donorType=OVUM).
  @IsOptional()
  @CleanOptional()
  @IsIn(['FRESH', 'FROZEN', 'DONOR'])
  opuSourceType?: 'FRESH' | 'FROZEN' | 'DONOR'

  @IsOptional()
  @CleanOptional()
  @IsString()
  sourceBatchId?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  sourceDonorId?: string

  @IsOptional()
  @CleanOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  consumedQty?: number

  @IsOptional()
  @CleanOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  survivalRate?: number

  @IsOptional()
  @CleanOptional()
  @IsDateString()
  receivedDate?: string

  @IsOptional()
  @CleanOptional()
  @IsIn(['In Progress', 'Completed', 'Failed'])
  status?: 'In Progress' | 'Completed' | 'Failed'

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  folliclesAspirated!: number

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  oocytesRetrieved!: number

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  matureOocytes!: number

  // Clinician-entered MI and GV counts. Free-form; no FA/MII-derived
  // validation (see project_opu_mi_gv_manual memory note).
  @IsOptional()
  @CleanOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  miOocytes?: number

  @IsOptional()
  @CleanOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  gvOocytes?: number

  @IsOptional()
  @CleanOptional()
  @IsString()
  embryologistId?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  anesthesiaType?: string

  @IsOptional()
  @CleanOptional()
  @IsIn(['IVF', 'ICSI', 'SPLIT', 'MIXED'])
  fertilizationMethod?: 'IVF' | 'ICSI' | 'SPLIT' | 'MIXED'

  @IsOptional()
  @CleanOptional()
  @IsObject()
  spermAnalysis?: Record<string, any>

  @IsOptional()
  @CleanOptional()
  @IsArray()
  oocyteMaturity?: any[]

  // MII clinical grading subdoc. Schema accepts any of the 4 axes plus
  // free-form remarks; the dialog only sends this block when MII > 0.
  @IsOptional()
  @CleanOptional()
  @IsObject()
  oocyteQuality?: {
    cytoplasm?: string
    zonaPellucida?: string
    polarBody?: string
    perivitellineSpace?: string
    remarks?: string
  }

  @IsOptional()
  @CleanOptional()
  @IsString()
  notes?: string
}

export class UpdatePickupDto {
  @IsOptional()
  @CleanOptional()
  @IsDateString()
  date?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  procedureTime?: string

  @IsOptional()
  @CleanOptional()
  @IsIn(['ICSI', 'FREEZE'])
  pickupType?: 'ICSI' | 'FREEZE'

  @IsOptional()
  @CleanOptional()
  @IsIn(['FRESH', 'FROZEN', 'DONOR'])
  opuSourceType?: 'FRESH' | 'FROZEN' | 'DONOR'

  @IsOptional()
  @CleanOptional()
  @IsString()
  sourceBatchId?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  sourceDonorId?: string

  @IsOptional()
  @CleanOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  consumedQty?: number

  @IsOptional()
  @CleanOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  survivalRate?: number

  @IsOptional()
  @CleanOptional()
  @IsDateString()
  receivedDate?: string

  @IsOptional()
  @CleanOptional()
  @IsIn(['In Progress', 'Completed', 'Failed'])
  status?: 'In Progress' | 'Completed' | 'Failed'

  @IsOptional()
  @CleanOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  folliclesAspirated?: number

  @IsOptional()
  @CleanOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  oocytesRetrieved?: number

  @IsOptional()
  @CleanOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  matureOocytes?: number

  // Clinician-entered MI and GV counts. Free-form; no FA/MII-derived
  // validation (see project_opu_mi_gv_manual memory note).
  @IsOptional()
  @CleanOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  miOocytes?: number

  @IsOptional()
  @CleanOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  gvOocytes?: number

  @IsOptional()
  @CleanOptional()
  @IsString()
  embryologistId?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  anesthesiaType?: string

  @IsOptional()
  @CleanOptional()
  @IsIn(['IVF', 'ICSI', 'SPLIT', 'MIXED'])
  fertilizationMethod?: 'IVF' | 'ICSI' | 'SPLIT' | 'MIXED'

  @IsOptional()
  @CleanOptional()
  @IsObject()
  spermAnalysis?: Record<string, any>

  @IsOptional()
  @CleanOptional()
  @IsArray()
  oocyteMaturity?: any[]

  @IsOptional()
  @CleanOptional()
  @IsObject()
  oocyteQuality?: {
    cytoplasm?: string
    zonaPellucida?: string
    polarBody?: string
    perivitellineSpace?: string
    remarks?: string
  }

  @IsOptional()
  @CleanOptional()
  @IsString()
  notes?: string
}
