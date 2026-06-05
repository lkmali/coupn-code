import { IsBoolean, IsNumber, IsOptional } from 'class-validator'
import { CleanOptional } from '../decorators'



export class UpdateLeadFollowupDto {
  @IsOptional()
  @CleanOptional()
  @IsNumber()
  public followupCounts?: number

  @IsOptional()
  @CleanOptional()
  @IsBoolean()
  public requiredFollowup?: boolean

}
