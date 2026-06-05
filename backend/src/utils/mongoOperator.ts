/**
 * MongoDB query operator utilities
 */

import { Types } from 'mongoose'

/**
 * Whitelist of field names known to contain MongoDB ObjectIds.
 */
const OBJECT_ID_FIELDS: Set<string> = new Set([
  '_id',
  'orgId',
  'leadId',
  'patientId',
  'doctorId',
  'appointmentId',
  'taskId',
  'userId',
  'roleId',
  'permissionId',
  'contactId',
  'keyId',
  'createdBy',
  'updatedBy',
  'assignUserId',
  'assignDoctorId',
  'assignToUserId',
  'socialContactId',
  'sessionId',
  'treatmentPlanId',
  'treatmentCycleId',
  'medicationProtocolId',
  'monitoringRecordId',
  'workflowTaskId',
  'cycleDocumentId',
  'workflowTemplateId',
  'previousTreatmentPlanId',
  'currentCycleId',
  's3TempKeyId',
  'uploadedBy',
  'completedBy',
  'activeTreatmentPlanId',
  'reportId',
  'timelineEventId',
  'timelineTaskId',
  'timelineSubtaskId',
  'eventId',
  'cycleId',
])

/**
 * Whitelist of field names known to contain Date values.
 * MongoDB requires actual Date objects for date comparisons — ISO strings won't match BSON ISODate.
 */
const DATE_FIELDS: Set<string> = new Set([
  'startDate',
  'endDate',
  'createdAt',
  'updatedAt',
  'activityTime',
  'dueDate',
  'timestamp',
  'otpExpires',
  'followUpDate',
  'marriedSince',
  'lastMessageAt',
  'currentAppointment',
  'day2Date',
  'stimulationStartDate',
  'triggerDate',
  'iuiDate',
  'lutealStartDate',
  'expectedMensesDate',
  'actualMensesDate',
  'visitDate',
  'completedAt',
  'registrationDate',
  'marriageDate',
  'recordDate',
  'lastActivityAt',
])

/**
 * ISO 8601 date string pattern: "2026-02-19T17:10:05.435Z" or "2026-02-19T17:10:05+05:30"
 */
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/

function isValidObjectIdString(value: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(value)
}

export function toObjectId(id: any): Types.ObjectId {
  if (id instanceof Types.ObjectId) return id
  return new Types.ObjectId(id?.toString())
}

function isIsoDateString(value: string): boolean {
  return ISO_DATE_REGEX.test(value) && !isNaN(Date.parse(value))
}

function convertDateValue(value: any): any {
  if (value instanceof Date) return value
  if (typeof value === 'string' && isIsoDateString(value)) {
    return new Date(value)
  }
  // Handle moment objects (have _isAMomentObject flag and toDate method)
  if (value && typeof value === 'object' && value._isAMomentObject && typeof value.toDate === 'function') {
    return value.toDate()
  }
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    const converted: any = {}
    for (const [op, opValue] of Object.entries(value)) {
      if (op === '$gte' || op === '$gt' || op === '$lte' || op === '$lt' || op === '$eq' || op === '$ne') {
        converted[op] = convertDateValue(opValue)
      } else {
        converted[op] = opValue
      }
    }
    return converted
  }
  return value
}

function convertIdValue(value: any): any {
  if (value instanceof Types.ObjectId) return value
  if (typeof value === 'string') {
    return isValidObjectIdString(value) ? new Types.ObjectId(value) : value
  }
  if (Array.isArray(value)) {
    return value.map((item) => convertIdValue(item))
  }
  if (typeof value === 'object' && value !== null) {
    const converted: any = {}
    for (const [op, opValue] of Object.entries(value)) {
      if (op === '$in' || op === '$nin') {
        converted[op] = (opValue as any[]).map((item) => convertIdValue(item))
      } else if (op === '$ne' || op === '$eq') {
        converted[op] = convertIdValue(opValue)
      } else if (op === '$not') {
        converted[op] = convertIdValue(opValue)
      } else if (op === '$exists' || op === '$type') {
        converted[op] = opValue
      } else {
        converted[op] = opValue
      }
    }
    return converted
  }
  return value
}

/**
 * Recursively convert known ID fields from string to ObjectId in a MongoDB query.
 * Handles direct values, $in/$nin, $ne/$eq, $or/$and/$nor, $not.
 * Idempotent: already-ObjectId values pass through unchanged.
 * Safe: non-24-char-hex strings are left as-is.
 */
export function convertQueryIds<T = any>(query: T): T {
  if (!query || typeof query !== 'object') return query
  if (query instanceof Types.ObjectId) return query
  if (query instanceof Date) return query
  if (Array.isArray(query)) {
    return query.map((item) => convertQueryIds(item)) as any
  }

  const result: any = {}
  for (const [key, value] of Object.entries(query as any)) {
    if (value === null || value === undefined) {
      result[key] = value
      continue
    }
    if (key === '$or' || key === '$and' || key === '$nor') {
      result[key] = (value as any[]).map((item) => convertQueryIds(item))
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
    if (DATE_FIELDS.has(key)) {
      result[key] = convertDateValue(value)
      continue
    }
    result[key] = value
  }
  return result as T
}

export const inOperator = (value: any[]) => {
  return { $in: value }
}

export const notInOperator = (value: any[]) => {
  return { $nin: value }
}

export const neOperator = (value: any) => {
  return { $ne: value }
}

export const ltOperator = (value: any) => {
  return { $lt: value }
}

export const lteOperator = (value: any) => {
  return { $lte: value }
}

export const gtOperator = (value: any) => {
  return { $gt: value }
}

export const gteOperator = (value: any) => {
  return { $gte: value }
}

/**
 * Checks if an array field contains ANY of the given values
 */
export const hasSome = (keyName: string, values: string[]) => {
  return {
    [keyName]: { $in: values },
  }
}

/**
 * Checks if an array field contains NONE of the given values
 */
export const hasNone = (keyName: string, values: string[]) => {
  return {
    [keyName]: { $nin: values },
  }
}

/**
 * Build a case-insensitive search query across multiple fields
 *
 * @param search - The search term
 * @param fields - Array of field names to search across
 * @returns MongoDB query with $or and $regex for case-insensitive partial match
 */
export function getMongoSearchQuery(search: string, fields: string[]): Record<string, any> {
  if (!search || !fields.length) return {}

  const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

  return {
    $or: fields.map((field) => ({
      [field]: { $regex: escapedSearch, $options: 'i' },
    })),
  }
}
