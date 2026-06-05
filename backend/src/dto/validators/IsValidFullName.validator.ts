import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator'
import { validateFullName } from '../../utils/name.util'

/**
 * DTO-level guard for any user-facing "full name" field. Delegates to the shared
 * `validateFullName` rule in utils/name.util.ts so the frontend and backend enforce
 * identical rules and reject the same inputs (no leading title, first + last required,
 * letters/hyphen/apostrophe only).
 *
 * @example
 *   @IsValidFullName()
 *   userName!: string
 */
export function IsValidFullName(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isValidFullName',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          // Let @IsOptional upstream decide whether undefined is acceptable.
          if (value === undefined || value === null) return true
          if (typeof value !== 'string') return false
          return validateFullName(value) === null
        },
        defaultMessage(args: ValidationArguments) {
          const err = validateFullName(args.value as string)
          // Fall back to a generic message if the value was the wrong type entirely.
          return err ?? 'Invalid full name'
        },
      },
    })
  }
}
