import { IsNotEmpty, IsString, IsIn, IsArray, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'

export class TaskFormDataItem {
  @IsString()
  @IsNotEmpty()
  public taskId!: string

  @IsNotEmpty()
  public formData!: Record<string, any>
}

export class TreatmentStartDto {
  @IsString()
  @IsNotEmpty({ message: 'Patient ID is required' })
  public patientId!: string

  @IsString()
  @IsNotEmpty({ message: 'Treatment type is required' })
  public treatmentType!: string

  @IsString()
  @IsIn(['DO_NOW', 'DO_LATER', 'NONE'])
  public prerequisiteAction!: 'DO_NOW' | 'DO_LATER' | 'NONE'
}

export class PrerequisiteSubmissionDto {
  @IsString()
  @IsNotEmpty({ message: 'Patient ID is required' })
  public patientId!: string

  @IsString()
  @IsNotEmpty({ message: 'Treatment type is required' })
  public treatmentType!: string

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TaskFormDataItem)
  public taskForms!: TaskFormDataItem[]
}
