import { IsOptional, IsString, IsBoolean } from 'class-validator'
import { CleanOptional } from '../../decorators'

export class GetDoctorQueryDto {
  @IsOptional()
  @CleanOptional()
  @IsString()
  public doctorId!: string

  @IsOptional()
  @CleanOptional()
  @IsBoolean()
  isActive?: boolean
}
