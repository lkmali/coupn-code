import { IsNotEmpty, IsString } from 'class-validator'
import { IsValidMobileNumber } from './validators/IsValidMobileNumber.validator'
import { IsValidFullName } from './validators/IsValidFullName.validator'

export class RegisterOrganizationDto {
  @IsString()
  @IsNotEmpty({ message: 'Mobile number should not be empty' })
  @IsValidMobileNumber({ message: 'Invalid mobile number format. Must include country code (91, 44, 1, or 971) without + prefix' })
  public adminMobileNumber!: string

  @IsString()
  @IsNotEmpty({ message: 'Admin name is required' })
  @IsValidFullName()
  adminName!: string

  @IsString()
  @IsNotEmpty({ message: 'Organization name is required' })
  organizationName!: string

  @IsString()
  @IsNotEmpty({ message: 'Admin email is required' })
  adminEmail!: string
}
