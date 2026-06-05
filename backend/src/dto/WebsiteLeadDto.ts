import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator'
import { Transform } from 'class-transformer'
import { CleanOptional } from '../decorators'
import { IsValidMobileNumber } from './validators/IsValidMobileNumber.validator'

/**
 * Public payload accepted by POST /lead/from-website. Intentionally narrow —
 * the website's form should only carry what's truly user-supplied. Source is
 * always stamped server-side as WEBSITE so the website cannot impersonate
 * other channels (WHATSAPP, REFERRAL, etc.).
 *
 * Auth: x-client-key + x-client-secret (KEY_VALID strategy). The credentials
 * resolve to the org's BOT user via ClientKeyService, so the lead lands in
 * the right tenant without anyone passing orgId in the body.
 */
export class WebsiteLeadDto {
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  @MaxLength(120)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  public name!: string

  @IsString()
  @IsNotEmpty({ message: 'Mobile number is required' })
  @IsValidMobileNumber({
    message: 'Invalid mobile number format. Must include country code (91, 44, 1, or 971) without + prefix',
  })
  public mobileNumber!: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  @MaxLength(200)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  public email?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  @MaxLength(2000)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().replace(/\s{3,}/g, ' ') : value))
  public message?: string
}
