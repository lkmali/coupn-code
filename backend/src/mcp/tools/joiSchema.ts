import Joi, { Schema } from 'joi'
import { MedicalTools } from './medicalTools'
import { z } from 'zod'

import { JsonSchema } from '../../typings'
import { pick } from 'lodash'
import { Messages } from '../../constants'
const toolJoiSchema = {} as Record<string, Schema>
function buildJoiSchema(
  properties: Record<string, any>,
  required: string[] = [],
  oneOf?: Array<{ required: string[] }>,
): Schema {
  const schema: Record<string, Schema> = {}

  // Build individual fields
  for (const [key, prop] of Object.entries(properties)) {
    let field: any

    switch (prop.type) {
      case 'string':
        field = Joi.string()
        if (prop.pattern) {
          field = field.pattern(new RegExp(prop.pattern)).messages({
            'string.pattern.base': prop.message || `${key} is invalid format`,
          })
        }
        if (prop.enum) {
          field = field.valid(...prop.enum).messages({
            'any.only': prop.message || `${key} must be one of ${prop.enum.join(', ')}`,
          })
        }
        if (prop.format === 'date-time') {
          field = Joi.date()
            .iso()
            .messages({
              'date.format': prop.message || `${key} must be a valid ISO date`,
            })
        }
        if (prop.format === 'uri') {
          field = Joi.string()
            .uri()
            .messages({
              'string.uri': prop.message || `${key} must be a valid URL`,
            })
        }
        break

      case 'number':
        field = Joi.number()
        if (prop.minimum !== undefined) {
          field = field.min(prop.minimum).messages({
            'number.min': prop.message || `${key} must be >= ${prop.minimum}`,
          })
        }
        if (prop.maximum !== undefined) {
          field = field.max(prop.maximum).messages({
            'number.max': prop.message || `${key} must be <= ${prop.maximum}`,
          })
        }
        break

      case 'array':
        if (prop.items) {
          field = Joi.array().items(buildJoiSchema({ item: prop.items }).extract('item'))
        } else {
          field = Joi.array()
        }
        break

      default:
        field = Joi.any()
    }

    if (prop.nullable) field = field.allow(null)
    if (prop.default !== undefined) field = field.default(prop.default)

    schema[key] = required.includes(key)
      ? field.required().messages({ 'any.required': prop.message || `${key} is required` })
      : field.optional().allow('', null)
  }

  let joiObject = Joi.object(schema)

  // Handle oneOf (at least one field in each required set must exist)
  if (oneOf && oneOf.length > 0) {
    for (const group of oneOf) {
      joiObject = joiObject.or(...group.required)
    }
  }

  return joiObject
}

function formatSchema(parameters: Record<string, any>, require: string[]): JsonSchema[] {
  const result = []
  for (const key in parameters) {
    result.push({
      name: key,
      type: parameters[key].type,
      require: require.includes(key),
      ...pick(parameters[key], ['description', 'pattern', 'enum', 'minimum', 'maximum', 'items', 'format']),
    } as JsonSchema)
  }
  return result
}

export function buildZodFromJsonSchema(schema: any): any {
  switch (schema.type) {
    // 🧠 STRING
    case 'string': {
      let base = z.string()
      if (schema.require) {
        return base.describe(schema.description || '')
      } else {
        // Optional fields stay undefined when omitted. Defaulting an optional
        // enum to its first value silently narrows list/search queries — e.g.
        // listTasks would inject status=PENDING, priority=URGENT, category=CLINICAL.
        return z
          .preprocess(
            val => (val === '' || val === null || val === undefined || val === 'undefined' ? undefined : val),
            base.optional(),
          )
          .describe(schema.description || '')
      }
    }

    // 🔢 NUMBER
    case 'number': {
      let base = z.number()
      if (schema.require) {
        return base.describe(schema.description || '')
      } else {
        return z
          .preprocess(
            val => (val === '' || val === null || val === undefined || val === 'undefined' ? undefined : Number(val)),
            base.optional(),
          )
          .describe(schema.description || '')
      }
    }

    // ✅ BOOLEAN
    case 'boolean': {
      let base = z.boolean()

      if (schema.require) {
        return base.describe(schema.description || '')
      } else {
        return z
          .preprocess(val => {
            if (val === '' || val === null || val === undefined) return undefined
            if (val === 'true' || val === true) return true
            if (val === 'false' || val === false) return false
            return undefined
          }, base.optional())
          .describe(schema.description || '')
      }
    }

    // 📜 ARRAY
    case 'array': {
      const itemSchema =
        schema.items?.type === 'string'
          ? z.string().regex(schema.items.pattern ? new RegExp(schema.items.pattern) : /.*/)
          : schema.items?.type === 'number'
          ? z.number()
          : z.any()

      let base = z.array(itemSchema)

      if (schema.require) {
        return base.describe(schema.description || '')
      } else {
        return z
          .preprocess(val => (Array.isArray(val) ? val : val == null ? undefined : [val]), base.optional())
          .describe(schema.description || '')
      }
    }

    // fallback
    default: {
      return z.any().describe(schema.description || '')
    }
  }
}
export function buildZodSchema(properties: Record<string, any>, required: string[] = []): any {
  const newProperties = formatSchema(properties, required)
  const schema: Record<string, Schema> = {}

  for (const prp of newProperties) {
    const field = buildZodFromJsonSchema({ ...prp })
    schema[prp.name] = field
  }

  return schema
}

for (const tool of MedicalTools) {
  const newTool = tool as any
  const properties = newTool.function.parameters.properties
  toolJoiSchema[newTool.function.name] = buildJoiSchema(
    properties,
    newTool.function.parameters.required ?? [],
    newTool.function.parameters.oneOf ?? [],
  )
}

export function validateToolInput(toolName: string, input: any): any {
  if (!toolJoiSchema[toolName]) {
    throw { message: Messages.ERROR.TRY_NEW_OPERATION }
  }

  // Clean the input: remove empty strings, undefined, and null values
  const cleanedInput = Object.keys(input).reduce((acc, key) => {
    const value = input[key]
    // Only include non-empty values
    if (value !== '' && value !== undefined && value !== null) {
      acc[key] = value
    }
    return acc
  }, {} as any)

  const joiSchema = toolJoiSchema[toolName]
  const { error, value } = joiSchema.validate(cleanedInput, { abortEarly: false })
  if (error) {
    // Format Joi error details
    const formattedErrors = error.details.map(detail => detail.message.replace(/["]/g, ''))
    throw { message: formattedErrors }
  }
  return value
}
