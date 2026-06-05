import { Request, Response, NextFunction } from 'express'
import { DEFAULT_TIMEZONE, TimezoneUtil } from '../utils/timezone.util'

/**
 * Timezone Middleware
 *
 * This middleware extracts timezone information from incoming requests
 * and makes it available throughout the request lifecycle.
 *
 * **How to specify timezone in API requests:**
 *
 * 1. **Via Header (Recommended):**
 *    ```
 *    X-Timezone: Asia/Kolkata
 *    X-Timezone: America/New_York
 *    X-Timezone: Europe/London
 *    ```
 *
 * 2. **Via Query Parameter:**
 *    ```
 *    ?timezone=Asia/Kolkata
 *    ```
 *
 * 3. **Via Request Body:**
 *    ```json
 *    {
 *      "timezone": "Asia/Kolkata",
 *      "appointmentDate": "2025-01-15 14:30:00"
 *    }
 *    ```
 *
 * **Priority Order:**
 * 1. Header (X-Timezone)
 * 2. Query parameter (timezone)
 * 3. Request body (timezone)
 * 4. Default (Asia/Kolkata)
 *
 * **Usage in Controllers/Services:**
 * ```typescript
 * const timezone = req.timezone; // "Asia/Kolkata"
 * const utcDate = TimezoneUtil.toUTC(dateString, timezone);
 * ```
 */

declare global {
  namespace Express {
    interface Request {
      timezone: string
    }
  }
}

export const timezoneMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  // Priority 1: Check header
  let timezone = req.headers['x-timezone'] as string

  // Priority 2: Check query parameter
  if (!timezone && req.query.timezone) {
    timezone = req.query.timezone as string
  }

  // Priority 3: Check request body
  if (!timezone && req.body && req.body.timezone) {
    timezone = req.body.timezone
  }

  // Validate timezone, fallback to default if invalid
  if (timezone && TimezoneUtil.isValidTimezone(timezone)) {
    req.timezone = timezone
  } else {
    req.timezone = DEFAULT_TIMEZONE
  }

  next()
}

export default timezoneMiddleware
