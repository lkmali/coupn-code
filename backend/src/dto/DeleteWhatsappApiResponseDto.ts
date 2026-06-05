import { IsNumber, IsOptional, IsString, Min } from 'class-validator'
import {IsValidMobileNumber} from './validators/IsValidMobileNumber.validator'

export class DeleteWhatsappApiResponseDto {
  @IsString()
  @IsOptional()
  public id?: string

  @IsString()
  @IsOptional()
 @IsValidMobileNumber({ message: 'Invalid mobile number format. Must include country code (91, 44, 1, or 971) without + prefix' })
  public mobileNumber?: string

  @IsNumber()
  @IsOptional()
  @Min(1)
  public daysOld?: number

  @IsNumber()
  @IsOptional()
  @Min(1)
  public hoursOld?: number

  @IsString()
  @IsOptional()
  public orgId?: string
}
