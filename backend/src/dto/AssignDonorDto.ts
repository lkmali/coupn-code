import { IsNotEmpty, IsString } from 'class-validator'

export class AssignDonorDto {
  @IsNotEmpty()
  @IsString()
  donorId!: string
}
