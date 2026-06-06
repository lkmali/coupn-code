import { IsEnum, IsNotEmpty } from 'class-validator'
import { UserStatus } from '../typings'

export class UpdateUserStatusDto {
  @IsNotEmpty()
  @IsEnum(UserStatus, { message: 'Status must be either ACTIVE or INACTIVE' })
  public status!: UserStatus
}
