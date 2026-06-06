import { IsNotEmpty, IsString } from 'class-validator'

export class RegisterOrganizationDto {
  @IsString()
  @IsNotEmpty({ message: 'Mobile number should not be empty' })
  public adminMobileNumber!: string

  @IsString()
  @IsNotEmpty({ message: 'Admin name is required' })
  adminName!: string

  @IsString()
  @IsNotEmpty({ message: 'Organization name is required' })
  organizationName!: string

  @IsString()
  @IsNotEmpty({ message: 'Admin email is required' })
  adminEmail!: string
}
