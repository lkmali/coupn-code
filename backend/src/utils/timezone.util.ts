import moment from 'moment-timezone'

/**
 * Timezone Utility Service
 *
 * This service ensures consistent timezone handling across the entire application.
 *
 * **Core Principles:**
 * 1. All dates are STORED in UTC in the database
 * 2. All dates are RECEIVED from API with timezone information
 * 3. All dates are CONVERTED to UTC before database operations
 * 4. All dates are CONVERTED from UTC to appropriate timezone when sending responses
 *
 * **Default Timezone:** Asia/Kolkata (IST)
 */

export const DEFAULT_TIMEZONE = 'Asia/Kolkata'
export const UTC_TIMEZONE = 'UTC'

export class TimezoneUtil {
  /**
   * Convert a date from any timezone to UTC for database storage
   *
   * @param date - Date string, Date object, or timestamp
   * @param sourceTimezone - Timezone of the input date (default: Asia/Kolkata)
   * @returns Date object in UTC
   *
   * @example
   * // Input: "2025-01-15 14:30:00" in IST
   * // Output: Date object representing "2025-01-15 09:00:00" UTC
   * const utcDate = TimezoneUtil.toUTC("2025-01-15 14:30:00", "Asia/Kolkata");
   */
  static toUTC(date: string | Date | number, sourceTimezone: string = DEFAULT_TIMEZONE): Date {
    if (!date) {
      throw new Error('Date is required for timezone conversion')
    }

    try {
      // If it's already a Date object or timestamp, parse it in the source timezone
      if (date instanceof Date || typeof date === 'number') {
        return moment.tz(date, sourceTimezone).utc().toDate()
      }

      // If it's an ISO string with timezone info (e.g., "2025-01-15T14:30:00+05:30")
      // Parse it directly
      if (typeof date === 'string' && (date.includes('+') || date.includes('Z'))) {
        return moment(date).utc().toDate()
      }

      // Otherwise, treat it as a date in the source timezone
      return moment.tz(date, sourceTimezone).utc().toDate()
    } catch (error: any) {
      throw new Error(`Failed to convert date to UTC: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Convert a UTC date from database to a specific timezone
   *
   * @param utcDate - Date object in UTC (from database)
   * @param targetTimezone - Target timezone (default: Asia/Kolkata)
   * @returns Date object in target timezone
   *
   * @example
   * // Input: Date object in UTC "2025-01-15 09:00:00"
   * // Output: Date object representing "2025-01-15 14:30:00" IST
   * const istDate = TimezoneUtil.fromUTC(dbDate, "Asia/Kolkata");
   */
  static fromUTC(utcDate: Date | null | undefined, targetTimezone: string = DEFAULT_TIMEZONE): Date | null {
    if (!utcDate) {
      return null
    }

    try {
      return moment.utc(utcDate).tz(targetTimezone).toDate()
    } catch (error: any) {
      throw new Error(`Failed to convert date from UTC: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Format a UTC date to a string in a specific timezone
   *
   * @param utcDate - Date object in UTC (from database)
   * @param targetTimezone - Target timezone (default: Asia/Kolkata)
   * @param format - Moment format string (default: 'YYYY-MM-DD HH:mm:ss')
   * @returns Formatted date string in target timezone
   *
   * @example
   * const formatted = TimezoneUtil.formatInTimezone(dbDate, "Asia/Kolkata", "MMMM D, YYYY [at] h:mm A");
   * // Output: "January 15, 2025 at 2:30 PM"
   */
  static formatInTimezone(
    utcDate: Date | null | undefined,
    targetTimezone: string = DEFAULT_TIMEZONE,
    format: string = 'YYYY-MM-DD HH:mm:ss',
  ): string | null {
    if (!utcDate) {
      return null
    }

    try {
      return moment.utc(utcDate).tz(targetTimezone).format(format)
    } catch (error: any) {
      throw new Error(`Failed to format date: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Parse a date string from API request and convert to UTC
   * This method detects if the date string includes timezone info
   *
   * @param dateString - Date string from API
   * @param defaultTimezone - Default timezone if not specified in string (default: Asia/Kolkata)
   * @returns Date object in UTC
   *
   * @example
   * // With timezone in string
   * TimezoneUtil.parseAPIDate("2025-01-15T14:30:00+05:30")
   *
   * // Without timezone (assumes IST)
   * TimezoneUtil.parseAPIDate("2025-01-15 14:30:00")
   */
  static parseAPIDate(dateString: string | Date, defaultTimezone: string = DEFAULT_TIMEZONE): Date {
    if (!dateString) {
      throw new Error('Date string is required')
    }

    // If already a Date object, convert to UTC
    if (dateString instanceof Date) {
      return this.toUTC(dateString, defaultTimezone)
    }

    try {
      // Check if the string has timezone information
      const hasTimezoneInfo =
        dateString.includes('+') ||
        (dateString.includes('-') && dateString.lastIndexOf('-') > 10) ||
        dateString.endsWith('Z')

      if (hasTimezoneInfo) {
        // Parse as ISO string with timezone
        return moment(dateString).utc().toDate()
      } else {
        // Treat as date in default timezone
        return this.toUTC(dateString, defaultTimezone)
      }
    } catch (error: any) {
      throw new Error(`Failed to parse API date: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get current date/time in UTC (for database storage)
   *
   * @returns Current Date object in UTC
   */
  static nowUTC(): Date {
    return moment.utc().toDate()
  }

  /**
   * Get current date/time in a specific timezone
   *
   * @param timezone - Target timezone (default: Asia/Kolkata)
   * @returns Current Date object in target timezone
   */
  static nowInTimezone(timezone: string = DEFAULT_TIMEZONE): Date {
    return moment.tz(timezone).toDate()
  }

  /**
   * Check if a timezone string is valid
   *
   * @param timezone - Timezone string to validate
   * @returns true if valid, false otherwise
   */
  static isValidTimezone(timezone: string): boolean {
    try {
      return moment.tz.zone(timezone) !== null
    } catch {
      return false
    }
  }

  /**
   * Get start of day in UTC for a given date and timezone
   *
   * @param date - Date string or Date object
   * @param timezone - Timezone of the input date (default: Asia/Kolkata)
   * @returns Date object representing start of day in UTC
   *
   * @example
   * // Input: "2025-01-15" in IST
   * // Output: "2025-01-14 18:30:00" UTC (midnight IST)
   */
  static startOfDayUTC(date: string | Date, timezone: string = DEFAULT_TIMEZONE): Date {
    return moment.tz(date, timezone).startOf('day').utc().toDate()
  }

  /**
   * Get end of day in UTC for a given date and timezone
   *
   * @param date - Date string or Date object
   * @param timezone - Timezone of the input date (default: Asia/Kolkata)
   * @returns Date object representing end of day in UTC
   *
   * @example
   * // Input: "2025-01-15" in IST
   * // Output: "2025-01-15 18:29:59.999" UTC (11:59:59 PM IST)
   */
  static endOfDayUTC(date: string | Date, timezone: string = DEFAULT_TIMEZONE): Date {
    return moment.tz(date, timezone).endOf('day').utc().toDate()
  }

  /**
   * Add duration to a date in UTC
   *
   * @param date - UTC date
   * @param amount - Amount to add
   * @param unit - Unit of time ('minutes', 'hours', 'days', etc.)
   * @returns New Date object in UTC
   */
  static addTime(date: Date, amount: number, unit: moment.unitOfTime.DurationConstructor): Date {
    return moment.utc(date).add(amount, unit).toDate()
  }

  /**
   * Subtract duration from a date in UTC
   *
   * @param date - UTC date
   * @param amount - Amount to subtract
   * @param unit - Unit of time ('minutes', 'hours', 'days', etc.)
   * @returns New Date object in UTC
   */
  static subtractTime(date: Date, amount: number, unit: moment.unitOfTime.DurationConstructor): Date {
    return moment.utc(date).subtract(amount, unit).toDate()
  }

  /**
   * Compare two dates (timezone-aware)
   *
   * @param date1 - First date
   * @param date2 - Second date
   * @returns -1 if date1 < date2, 0 if equal, 1 if date1 > date2
   */
  static compare(date1: Date, date2: Date): number {
    const m1 = moment.utc(date1)
    const m2 = moment.utc(date2)

    if (m1.isBefore(m2)) return -1
    if (m1.isAfter(m2)) return 1
    return 0
  }

  /**
   * Check if a date is in the past (UTC comparison)
   *
   * @param date - Date to check
   * @returns true if date is in the past
   */
  static isPast(date: Date): boolean {
    return moment.utc(date).isBefore(moment.utc())
  }

  /**
   * Check if a date is in the future (UTC comparison)
   *
   * @param date - Date to check
   * @returns true if date is in the future
   */
  static isFuture(date: Date): boolean {
    return moment.utc(date).isAfter(moment.utc())
  }

  /**
   * Extract timezone from request headers
   * Looks for 'X-Timezone' header or falls back to default
   *
   * @param headers - Request headers object
   * @returns Timezone string
   */
  static extractTimezoneFromHeaders(headers: any): string {
    const timezone = headers['x-timezone'] || headers['X-Timezone']

    if (timezone && this.isValidTimezone(timezone)) {
      return timezone
    }

    return DEFAULT_TIMEZONE
  }

  /**
   * Convert date range from any timezone to UTC for database queries
   *
   * @param startDate - Start date string or Date object
   * @param endDate - End date string or Date object
   * @param sourceTimezone - Timezone of input dates (default: Asia/Kolkata)
   * @returns Object with UTC start and end dates
   */
  static dateRangeToUTC(
    startDate: string | Date,
    endDate: string | Date,
    sourceTimezone: string = DEFAULT_TIMEZONE,
  ): { startDateUTC: Date; endDateUTC: Date } {
    return {
      startDateUTC: this.toUTC(startDate, sourceTimezone),
      endDateUTC: this.toUTC(endDate, sourceTimezone),
    }
  }
}

export default TimezoneUtil
