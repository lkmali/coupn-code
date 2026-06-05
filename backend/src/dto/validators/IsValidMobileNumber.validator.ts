import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator'
import { Transform } from 'class-transformer'
import { CountryService } from '../../service/country.service'

/**
 * Check if a number looks like a valid Indian mobile number without country code
 * Indian mobile numbers are 10 digits starting with 6, 7, 8, or 9
 */
function isIndianMobileWithoutCountryCode(mobileNumber: string): boolean {
  const cleanNumber = mobileNumber.replace(/[\s\-\+]/g, '')
  // 10 digits starting with 6-9
  return /^[6-9]\d{9}$/.test(cleanNumber)
}

/**
 * Normalize mobile number by adding country code if missing
 * - If number already has a valid country code, return as is
 * - If number looks like Indian mobile (10 digits starting with 6-9), add 91
 * @param mobileNumber - Mobile number (with or without country code)
 * @returns Normalized mobile number with country code
 */
export function normalizeMobileNumber(mobileNumber: string): string {
  if (!mobileNumber || typeof mobileNumber !== 'string') {
    return mobileNumber
  }

  // Remove spaces, dashes, and + prefix for processing
  const cleanNumber = mobileNumber.replace(/[\s\-]/g, '').replace(/^\+/, '')

  // Check if number already has a valid country code
  const countryService = CountryService.Instance
  const detectedCode = countryService.detectCountryCode(cleanNumber)

  if (detectedCode) {
    // Already has country code, return clean number (without +)
    return cleanNumber
  }

  // No country code detected - check if it's an Indian number without code
  if (isIndianMobileWithoutCountryCode(cleanNumber)) {
    return `91${cleanNumber}`
  }

  // Return as is (will fail validation if invalid)
  return cleanNumber
}

/**
 * Validates a mobile number based on detected country code using CountryService
 * Also handles numbers without country code (assumes Indian if 10 digits starting with 6-9)
 * @param mobileNumber - Mobile number (with or without country code/+ prefix)
 * @returns Validation result with success status and message
 */
export function validateMobileNumber(mobileNumber: string): { isValid: boolean; message: string; normalizedNumber?: string } {
  const countryService = CountryService.Instance

  // First normalize the number (add country code if missing)
  const normalizedNumber = normalizeMobileNumber(mobileNumber)

  const result = countryService.validateMobileNumber(normalizedNumber)

  return {
    isValid: result.isValid,
    message: result.message,
    normalizedNumber: result.isValid ? normalizedNumber : undefined,
  }
}

/**
 * Get all supported country codes
 */
export function getSupportedCountryCodes(): string[] {
  return CountryService.Instance.getSupportedCodes()
}

/**
 * Transformer decorator to normalize mobile numbers before validation
 * Use this alongside @IsValidMobileNumber to auto-add country code
 *
 * @example
 * @NormalizeMobileNumber()
 * @IsValidMobileNumber()
 * mobileNumber: string
 */
export function NormalizeMobileNumber() {
  return Transform(({ value }) => {
    if (typeof value === 'string') {
      return normalizeMobileNumber(value)
    }
    return value
  })
}

/**
 * Custom validator decorator for mobile number validation based on country
 * Validates that the mobile number:
 * - Contains only digits
 * - Starts with a supported country code OR is a valid 10-digit Indian number
 * - Matches the expected pattern for that country
 *
 * NOTE: This validator also TRANSFORMS the value by adding country code if missing.
 * Numbers without country code that look like Indian numbers (10 digits starting with 6-9)
 * will have 91 prefixed automatically.
 *
 * @example
 * // With country code:
 * // India: 919876543210 (91 + 10 digit number starting with 6-9)
 * // UK: 447911123456 (44 + 10 digit number starting with 7)
 * // US: 12025551234 (1 + 10 digit number)
 * // UAE: 971501234567 (971 + 9 digit number starting with 5)
 *
 * // Without country code (auto-adds 91 for Indian numbers):
 * // 9876543210 -> becomes 919876543210
 * // 8442033493 -> becomes 918442033493
 */
export function IsValidMobileNumber(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isValidMobileNumber',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') {
            return false
          }

          // Normalize the number first
          const normalizedNumber = normalizeMobileNumber(value)

          // Update the object with normalized value so controller receives it
          ;(args.object as any)[propertyName] = normalizedNumber

          const result = validateMobileNumber(value)
          return result.isValid
        },
        defaultMessage(args: ValidationArguments) {
          const value = args.value
          if (typeof value !== 'string') {
            return 'Mobile number must be a string'
          }
          const result = validateMobileNumber(value)
          return result.message
        },
      },
    })
  }
}
