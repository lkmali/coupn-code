import { z } from 'zod'

/**
 * Shape-only checks — these mirror src/constants/patterns.ts on the server.
 * We verify the format of what was typed, not that the number is reachable or
 * that the UPI handle resolves. Keep the two files in step.
 */
export const userDetailsSchema = z.object({
  userName: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(60, 'Full name must be less than 60 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Full name can only contain letters, spaces, hyphens, and apostrophes'),

  mobileNumber: z
    .string()
    .min(1, 'Phone number is required')
    .regex(
      /^(\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}$/,
      'Enter a valid Indian phone number (e.g., +91 98765 43210)'
    ),

  upiId: z
    .string()
    .min(1, 'UPI ID is required')
    .regex(
      /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/,
      'Enter a valid UPI ID (e.g., yourname@upi)'
    ),
})

export type UserDetailsFormData = z.infer<typeof userDetailsSchema>
