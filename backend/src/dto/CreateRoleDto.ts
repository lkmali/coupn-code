import { ArrayUnique, IsArray, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator'

export class CreateRoleDto {
  @IsString()
  @IsNotEmpty({ message: 'Name should not be empty' })
  @MaxLength(100, { message: 'Name must be at most 100 characters' })
  public name!: string

  @IsString()
  @IsNotEmpty({ message: 'Role key should not be empty' })
  @MaxLength(50, { message: 'Role key must be at most 50 characters' })
  @Matches(/^[A-Z_]+$/, { message: 'Role key must be uppercase letters and underscores only' })
  public roleKey!: string

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Description must be at most 500 characters' })
  public description?: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayUnique()
  public permissionIds?: string[]
}
