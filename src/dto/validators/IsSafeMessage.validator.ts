import { registerDecorator, ValidationOptions } from 'class-validator'

/**
 * Patterns that indicate script injection or malicious content in messages.
 * Allows: plain text, @mentions, email addresses, URLs, emojis, punctuation, newlines.
 */
const DANGEROUS_PATTERNS: { pattern: RegExp; description: string }[] = [
  { pattern: /<script[\s>]/i, description: 'Script tags are not allowed' },
  { pattern: /<\/script>/i, description: 'Script tags are not allowed' },
  { pattern: /javascript\s*:/i, description: 'JavaScript protocol is not allowed' },
  { pattern: /on\w+\s*=\s*["']/i, description: 'Event handlers are not allowed' },
  { pattern: /<iframe[\s>]/i, description: 'Iframe tags are not allowed' },
  { pattern: /<object[\s>]/i, description: 'Object tags are not allowed' },
  { pattern: /<embed[\s>]/i, description: 'Embed tags are not allowed' },
  { pattern: /<form[\s>]/i, description: 'Form tags are not allowed' },
  { pattern: /<input[\s>]/i, description: 'Input tags are not allowed' },
  { pattern: /vbscript\s*:/i, description: 'VBScript protocol is not allowed' },
  { pattern: /data\s*:\s*text\/html/i, description: 'Data URI with HTML is not allowed' },
  { pattern: /expression\s*\(/i, description: 'CSS expressions are not allowed' },
  { pattern: /url\s*\(\s*["']?\s*javascript/i, description: 'JavaScript in CSS url() is not allowed' },
  { pattern: /<\s*img[^>]+onerror/i, description: 'Image error handlers are not allowed' },
  { pattern: /<\s*svg[^>]*on\w+/i, description: 'SVG event handlers are not allowed' },
  { pattern: /\{\{.*\}\}/i, description: 'Template injection is not allowed' },
  { pattern: /\$\{.*\}/i, description: 'Template literal injection is not allowed' },
]

/**
 * Checks if a message string contains any dangerous/script injection patterns.
 * Allows plain text, emails, @mentions, URLs, emojis, newlines, and standard punctuation.
 *
 * @param message - The message to validate
 * @returns Object with isValid flag and optional error description
 */
export function validateMessageContent(message: string): { isValid: boolean; description?: string } {
  for (const { pattern, description } of DANGEROUS_PATTERNS) {
    if (pattern.test(message)) {
      return { isValid: false, description }
    }
  }
  return { isValid: true }
}

/**
 * Custom validator decorator that rejects messages containing script injection patterns.
 * Allows: plain text, @mentions, email addresses, URLs, emojis, punctuation, newlines.
 * Rejects: <script>, javascript:, onclick=, <iframe>, template injections, etc.
 *
 * @example
 * @IsSafeMessage()
 * @IsString()
 * @IsNotEmpty()
 * message: string
 */
export function IsSafeMessage(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isSafeMessage',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          if (typeof value !== 'string') {
            return true // Let @IsString handle non-string validation
          }
          const result = validateMessageContent(value)
          return result.isValid
        },
        defaultMessage() {
          return 'Message contains unsafe content. Only plain text, emails, and standard characters are allowed.'
        },
      },
    })
  }
}
