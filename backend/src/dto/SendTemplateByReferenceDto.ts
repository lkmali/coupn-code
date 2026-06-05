import { IsNotEmpty, IsString, IsOptional } from 'class-validator'
import { CleanOptional } from '../decorators'

export class SendTemplateByReferenceDto {
  @IsString()
  @IsNotEmpty({ message: 'referenceId is required' })
  referenceId!: string

  @IsString()
  @IsNotEmpty({ message: 'templateType is required' })
  templateType!: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  appointmentId?: string
}
