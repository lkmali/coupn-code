import { IsNotEmpty, IsString, IsOptional, IsArray, IsBoolean, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'

export class MasterDataItemDto {
  @IsNotEmpty()
  @IsString()
  id!: string

  @IsNotEmpty()
  @IsString()
  title!: string
}

export class SOPTreatmentTypeItemDto {
  @IsNotEmpty()
  @IsString()
  id!: string

  @IsNotEmpty()
  @IsString()
  title!: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsString()
  icon?: string

  @IsOptional()
  @IsString()
  color?: string
}

export class UpdateOrganizationMasterDataDto {
  @IsOptional()
  @IsString()
  logoUrl?: string

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MasterDataItemDto)
  activityType?: MasterDataItemDto[]

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MasterDataItemDto)
  leadSource?: MasterDataItemDto[]

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MasterDataItemDto)
  leadStatus?: MasterDataItemDto[]

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MasterDataItemDto)
  appointmentType?: MasterDataItemDto[]

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MasterDataItemDto)
  appointmentMode?: MasterDataItemDto[]

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MasterDataItemDto)
  documentType?: MasterDataItemDto[]

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sideMenuItems?: string[]

  @IsOptional()
  @IsArray()
  menuItemsConfig?: any[]

  @IsOptional()
  @IsArray()
  sidebarSections?: any[]

  @IsOptional()
  @IsArray()
  roleUiConfig?: any[]

  @IsOptional()
  @IsBoolean()
  sopEnabled?: boolean

  @IsOptional()
  @IsBoolean()
  visitTabEnabled?: boolean

  // Per-hospital prefix for auto-generated patient registration numbers (e.g. 'REG-', 'MH-').
  @IsOptional()
  @IsString()
  patientRegistrationPrefix?: string

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SOPTreatmentTypeItemDto)
  sopTreatmentTypes?: SOPTreatmentTypeItemDto[]

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MasterDataItemDto)
  sopTaskCategories?: MasterDataItemDto[]

  @IsOptional()
  @IsArray()
  organizationForms?: any[]

  @IsOptional()
  @IsArray()
  defaultPatientTasks?: any[]

  @IsOptional()
  @IsArray()
  treatmentPrerequisiteConfig?: any[]

  // Module/section catalog edited from superadmin.html → drives task→tab routing across customer screens.
  // Validated as a free array because the inner shape is documented in IModuleRegistryEntry; tightening
  // here would force schema changes every time we add an optional field.
  @IsOptional()
  @IsArray()
  moduleRegistry?: any[]

  // Per-org cryo-tank layout (tanks → canisters → goblets → vizo colours + straw positions).
  // Validated as `any` for the same reason as moduleRegistry — the typed shape lives in
  // ICryoStorage. Used by embryo + oocyte freeze dialogs and the slot-uniqueness checker.
  @IsOptional()
  cryoStorage?: any
}

export class AddMasterDataItemDto {
  @IsNotEmpty()
  @IsString()
  field!: 'activityType' | 'leadSource' | 'leadStatus' | 'appointmentType' | 'appointmentMode' | 'documentType' | 'sopTreatmentTypes' | 'sopTaskCategories'

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => SOPTreatmentTypeItemDto)
  item!: SOPTreatmentTypeItemDto
}

export class RemoveMasterDataItemDto {
  @IsNotEmpty()
  @IsString()
  field!: 'activityType' | 'leadSource' | 'leadStatus' | 'appointmentType' | 'appointmentMode' | 'documentType' | 'sopTreatmentTypes' | 'sopTaskCategories'

  @IsNotEmpty()
  @IsString()
  itemId!: string
}
