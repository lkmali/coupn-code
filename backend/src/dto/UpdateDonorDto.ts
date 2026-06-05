import { IsOptional, IsString, IsNumber } from 'class-validator'
import { CleanOptional } from '../decorators'

export class UpdateDonorDto {
  @IsOptional()
  @CleanOptional()
  @IsString()
  realName?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  anonymousName?: string

  @IsOptional()
  @CleanOptional()
  @IsNumber()
  age?: number

  @IsOptional()
  @CleanOptional()
  @IsString()
  bloodGroup?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  rhFactor?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  ethnicity?: string

  @IsOptional()
  @CleanOptional()
  @IsNumber()
  height?: number

  @IsOptional()
  @CleanOptional()
  @IsNumber()
  weight?: number

  @IsOptional()
  @CleanOptional()
  @IsString()
  education?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  occupation?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  skinColor?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  hairColor?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  eyeColor?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  status?: string
}
