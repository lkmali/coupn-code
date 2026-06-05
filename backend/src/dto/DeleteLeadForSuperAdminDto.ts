import { IsNotEmpty, IsString } from 'class-validator'
import {IsValidMobileNumber} from './validators/IsValidMobileNumber.validator'

export class DeleteLeadForSuperAdminDto {
  @IsString()
  @IsNotEmpty()
  @IsValidMobileNumber({ message: 'Invalid mobile number format. Must include country code (91, 44, 1, or 971) without + prefix' })
  public mobileNumber!: string

  @IsString()
  @IsNotEmpty()
  public orgId!: string
}
