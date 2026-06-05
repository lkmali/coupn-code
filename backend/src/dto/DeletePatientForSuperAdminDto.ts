import { IsNotEmpty, IsString } from 'class-validator'

export class DeletePatientForSuperAdminDto {
  @IsString()
  @IsNotEmpty()
  public patientId!: string

  @IsString()
  @IsNotEmpty()
  public orgId!: string
}
