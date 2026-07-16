/**
 * MongoDB query operator utilities
 */

import { Types } from 'mongoose'

/**
 * Field names known to hold MongoDB ObjectIds — these get coerced from string
 * form before a query is issued.
 */
const OBJECT_ID_FIELDS: Set<string> = new Set(['_id'])

function isValidObjectIdString(value: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(value)
}

export function toObjectId(id: any): Types.ObjectId {
  if (id instanceof Types.ObjectId) return id
  return new Types.ObjectId(id?.toString())
}

function convertIdValue(value: any): any {
  if (value instanceof Types.ObjectId) return value
  if (typeof value === 'string') {
    return isValidObjectIdString(value) ? new Types.ObjectId(value) : value
  }
  if (Array.isArray(value)) {
    return value.map(item => convertIdValue(item))
  }
  if (typeof value === 'object' && value !== null) {
    const converted: any = {}
    for (const [op, opValue] of Object.entries(value)) {
      if (op === '$in' || op === '$nin') {
        converted[op] = (opValue as any[]).map(item => convertIdValue(item))
      } else if (op === '$ne' || op === '$eq' || op === '$not') {
        converted[op] = convertIdValue(opValue)
      } else {
        converted[op] = opValue
      }
    }
    return converted
  }
  return value
}

/**
 * Recursively convert known ID fields from string to ObjectId in a query.
 * Idempotent: already-ObjectId values pass through unchanged.
 * Safe: non-24-char-hex strings are left as-is.
 */
export function convertQueryIds<T = any>(query: T): any {
  if (!query || typeof query !== 'object') return query
  if (query instanceof Types.ObjectId) return query
  if (query instanceof Date) return query
  if (Array.isArray(query)) {
    return query.map(item => convertQueryIds(item)) as any
  }

  const result: any = {}
  for (const [key, value] of Object.entries(query as any)) {
    if (value === null || value === undefined) {
      result[key] = value
      continue
    }
    if (key === '$or' || key === '$and' || key === '$nor') {
      result[key] = (value as any[]).map(item => convertQueryIds(item))
      continue
    }
    if (key === '$not' && typeof value === 'object') {
      result[key] = convertQueryIds(value)
      continue
    }
    if (OBJECT_ID_FIELDS.has(key)) {
      result[key] = convertIdValue(value)
      continue
    }
    result[key] = value
  }
  return result as T
}
