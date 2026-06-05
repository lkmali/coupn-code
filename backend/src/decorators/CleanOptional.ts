import { Transform } from 'class-transformer'

/**
 * Custom decorator that removes null or empty string values from optional fields
 * Use this with @IsOptional() to clean up optional fields before validation
 */
export function CleanOptional() {
  return Transform(({ value }) => {
    // If value is null, undefined, or an empty string, return undefined
    if (value === null || value === '' || value === undefined) {
      return undefined
    }
    return value
  })
}
