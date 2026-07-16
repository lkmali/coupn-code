import { IsOptional, IsString, Matches } from 'class-validator'
import { FINGERPRINT_PATTERN, MACHINE_ID_PATTERN } from '../constants/patterns'

export class LookupUserQuery {
  @IsOptional()
  @IsString()
  @Matches(MACHINE_ID_PATTERN, { message: 'machineId is malformed' })
  machineId?: string

  @IsOptional()
  @IsString()
  @Matches(FINGERPRINT_PATTERN, { message: 'fingerprint is malformed' })
  fingerprint?: string
}
