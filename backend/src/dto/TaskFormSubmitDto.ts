import { IsNotEmpty, IsObject } from 'class-validator'

export class TaskFormSubmitDto {
  @IsObject()
  @IsNotEmpty({ message: 'Form data should not be empty' })
  public formData!: Record<string, any>
}
