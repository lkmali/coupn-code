import { IsArray, IsDateString, IsNotEmpty, IsString } from 'class-validator'
import { Transform } from 'class-transformer'

export class AddNoteDto {
  @IsString()
  public leadId!: string

  @IsDateString()
  @IsNotEmpty()
  callDate!: Date

  @IsString()
  @IsNotEmpty()
  public noteType!: string

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => typeof value === 'string' ? value.trim().replace(/\n{3,}/g, '\n\n').replace(/[ \t]+$/gm, '') : value)
  public description!: string

  @IsArray()
  @IsString({ each: true })
  noteTags!: string[]
}
