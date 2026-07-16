import { IsString, Matches, MaxLength, MinLength } from 'class-validator'
import { MACHINE_ID_PATTERN, MOBILE_NUMBER_PATTERN, UPI_ID_PATTERN, USER_NAME_PATTERN } from '../constants/patterns'

/**
 * Settings-page edit. machineId identifies which record is being edited —
 * you can only edit a record your own device is already linked to.
 */
export class UpdateUserDto {
  @IsString()
  @Matches(MACHINE_ID_PATTERN, { message: 'machineId is malformed' })
  machineId!: string

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
