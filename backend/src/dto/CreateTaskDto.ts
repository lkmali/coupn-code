import { IsArray, IsBoolean, IsDateString, IsIn, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString } from 'class-validator'
import { CleanOptional } from '../decorators'
import { IFormConfig } from '../typings/mongoModel'
export class CreateTaskDto {
  @IsString()
  @IsNotEmpty({ message: 'Assign to user ID should not be empty' })
  public assignToUserId!: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  title!: string

  @IsString()
  @IsNotEmpty()
  description!: string

  @IsString()
  @IsNotEmpty()
  category!: string

  @IsDateString()
  @IsNotEmpty()
  dueDate!: string

  @IsNumber()
  @IsNotEmpty()
  priority!: number

  @IsOptional()
  @CleanOptional()
  @IsString()
  public patientId!: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  taskType?: string

  @IsOptional()
  @IsObject()
  formConfig?: IFormConfig

  // Optional links — when set, frontend uses these to scope the task:
  // - timelineId: attaches the task to a specific timeline entry so it appears under that card
  // - formId: pulls a published org form into formConfig at create time
  // - moduleSectionKeys: routes the task to a stage tab within a module-registry module
  @IsOptional()
  @CleanOptional()
  @IsString()
  timelineId?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  formId?: string

  @IsOptional()
  @IsArray()
  moduleSectionKeys?: { moduleKey: string; sectionKey: string }[]

  // userId of the reviewing doctor. When set, completing this task auto-spawns a
  // "Review Reports" follow-up assigned to this doctor (see TasksService.spawnReviewTaskIfNeeded).
  @IsOptional()
  @CleanOptional()
  @IsString()
  reviewerDoctorId?: string

  // When true, clinicians should inform the patient about this task (notification wiring TBD).
  @IsOptional()
  @CleanOptional()
  @IsBoolean()
  informPatient?: boolean

  // Patient-portal visibility — `private` (default) keeps the task staff-only; `public` surfaces it
  // to the patient. Patient-app task list filters on this.
  @IsOptional()
  @CleanOptional()
  @IsString()
  @IsIn(['public', 'private'])
  visibility?: 'public' | 'private'
}
