import { plainToInstance } from 'class-transformer'
import { validate, ValidationError } from 'class-validator'
import { badRequest } from './index'

type ClassType<T> = new () => T

export async function validateBody<T extends object>(DtoClass: ClassType<T>, body: any): Promise<T> {
  const instance = plainToInstance(DtoClass, body)
  const errors: ValidationError[] = await validate(instance, { whitelist: true, forbidNonWhitelisted: true })

  if (errors.length > 0) {
    const messages = errors.flatMap((err) =>
      err.constraints ? Object.values(err.constraints) : [`${err.property} is invalid`],
    )
    throw badRequest(messages.join(', '))
  }

  return instance
}
