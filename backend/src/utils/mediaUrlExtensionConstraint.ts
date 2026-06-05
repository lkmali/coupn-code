import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from 'class-validator'
import { TestimonialType } from '../typings'
// adjust path

@ValidatorConstraint({ name: 'MediaUrlExtension', async: false })
export class MediaUrlExtensionConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    if (!value) return true // @IsNotEmpty will handle required

    const obj = args.object as any

    if (obj.type === TestimonialType.audio) {
      return /\.mp3(\?.*)?$/.test(value)
    }

    if (obj.type === TestimonialType.video) {
      return /\.mp4(\?.*)?$/.test(value)
    }

    // for text or unknown types we don't enforce extension here
    return true
  }

  defaultMessage(args: ValidationArguments) {
    const obj = args.object as any

    if (obj.type === TestimonialType.audio) {
      return 'publicUrl must be an MP3 file URL'
    }

    if (obj.type === TestimonialType.video) {
      return 'publicUrl must be an MP4 file URL'
    }

    return 'publicUrl has invalid media type'
  }
}
