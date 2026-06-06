import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator'

/**
 * Custom validator to ensure at least one of the specified properties is provided
 */
export function IsAtLeastOneOf(properties: string[], validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isAtLeastOneOf',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [properties],
      options: validationOptions,
      validator: {
        validate(_value: any, args: ValidationArguments) {
          const relatedProperties = args.constraints[0]
          const object = args.object as any
          return relatedProperties.some((prop: string) => object[prop] != null && object[prop] !== '')
        },
        defaultMessage(args: ValidationArguments) {
          return `At least one of ${args.constraints[0].join(', ')} must be provided`
        },
      },
    })
  }
}
