import { IsNotEmpty, IsString } from 'class-validator'

export class CallAlertBodyDto {
  @IsString()
  @IsNotEmpty({ message: 'Caller is required' })
  public caller!: string

  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  public name!: string

  @IsString()
  @IsNotEmpty({ message: 'Purpose is required' })
  public purpose!: string

  @IsString()
  @IsNotEmpty({ message: 'Time is required' })
  public time!: string
}
