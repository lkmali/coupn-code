/**
 * Centralized message constants for the application
 */

export const Messages = {
  SUCCESS: {
    USER_CREATED: 'User details saved successfully',
    USER_PROFILE_UPDATED: 'User details updated successfully',
  },

  ERROR: {
    USER_NOT_FOUND: 'User not found',
    MOBILE_ALREADY_IN_USE: 'This mobile number is already registered on another account',
    VALIDATION_FAILED: 'Validation failed',
    INTERNAL_SERVER_ERROR: 'Internal server error',
    REQUEST_FAILED: 'Request failed',
  },

  VALIDATION: {
    MACHINE_ID_REQUIRED: 'machineId or fingerprint is required',
  },
}
