import { IsOptional, IsString } from 'class-validator'
import { CleanOptional } from '../../decorators'
import { PaginationQuery } from './PaginationQuery'

export class GetWhatsappApiResponseQueryDto extends PaginationQuery {
  @IsOptional()
  @CleanOptional()
  @IsString()
  mobileNumber?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  eventName?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  status?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  orgId?: string
}
