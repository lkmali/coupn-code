import { IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator'
import {
  FINGERPRINT_PATTERN,
  MACHINE_ID_PATTERN,
  MOBILE_NUMBER_PATTERN,
  UPI_ID_PATTERN,
  USER_NAME_PATTERN,
} from '../constants/patterns'

export class SaveUserDto {
  @IsString()
  @Matches(MACHINE_ID_PATTERN, { message: 'machineId is malformed' })
  machineId!: string

  @IsOptional()
  @IsString()
  @Matches(FINGERPRINT_PATTERN, { message: 'fingerprint is malformed' })
  fingerprint?: string

  @IsString()
  @MinLength(2, { message: 'Full name must be at least 2 characters' })
  @MaxLength(60, { message: 'Full name must be less than 60 characters' })
  @Matches(USER_NAME_PATTERN, {
    message: 'Full name can only contain letters, spaces, hyphens, and apostrophes',
  })
  userName!: string

  @IsString()
  @Matches(MOBILE_NUMBER_PATTERN, {
    message: 'Enter a valid Indian phone number (e.g., +91 98765 43210)',
  })
  mobileNumber!: string

  @IsString()
  @Matches(UPI_ID_PATTERN, { message: 'Enter a valid UPI ID (e.g., yourname@upi)' })
  upiId!: string
}
