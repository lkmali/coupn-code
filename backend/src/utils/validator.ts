// utils/validator.ts
import Joi from 'joi'

export const validateBody = (schema: Joi.ObjectSchema, body: any) => {
  const { error, value } = schema.validate(body, {
    abortEarly: false,
    allowUnknown: false,
  })
  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
    }))
    throw { status: 400, errors }
  }
  return value
}
