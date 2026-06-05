import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator'
import { CleanOptional } from '../../decorators'
import { MessageDirection } from '../../typings'

export class AddCallActivityAgentDto {
  @IsString()
  @IsNotEmpty()
  public referenceId!: string

  @ValidateIf(o => !o.sid)
  @IsString()
  @IsNotEmpty({ message: 'Either callId or sid must be provided' })
  public callId!: string

  @IsOptional()
  @CleanOptional()
  @IsEnum(MessageDirection, {
    message: 'Direction must be INBOUND or OUTBOUND',
  })
  public direction: MessageDirection = MessageDirection.OUTBOUND

  @IsOptional()
  @CleanOptional()
  @IsString()
  public callStatus!: string

  @ValidateIf(o => !o.callId)
  @IsString()
  @IsNotEmpty({ message: 'Either callId or sid must be provided' })
  public sid!: string

  @IsOptional()
  @CleanOptional()
  @IsBoolean()
  public callSuccessful!: boolean

  @IsOptional()
  @CleanOptional()
  @IsString()
  public disconnectionReason?: string

  @IsOptional()
  @CleanOptional()
  @IsNumber()
  public callDuration?: number

  @IsOptional()
  @CleanOptional()
  @IsString()
  public description?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  public action?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  public userSentiment?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  public circle?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  public aiSummery?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  public recordingUrl?: string

  @IsOptional()
  @CleanOptional()
  @IsBoolean()
  public requiredFollowup?: boolean

  @IsOptional()
  @CleanOptional()
  @IsNumber()
  public followupCounts?: number

  @IsOptional()
  @CleanOptional()
  @IsDateString()
  public followUpDate?: Date
}
