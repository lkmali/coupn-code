import { IsNotEmpty, IsString, MaxLength } from 'class-validator'

export class UpdateRoleDescriptionDto {
  @IsString()
  @IsNotEmpty({ message: 'Description should not be empty' })
  @MaxLength(500, { message: 'Description must be at most 500 characters' })
  public description!: string
}
