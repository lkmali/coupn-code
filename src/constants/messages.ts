/**
 * Centralized message constants for the application
 * Use these constants throughout the codebase for consistent messaging
 */

export const Messages = {
  // ==================== SUCCESS MESSAGES ====================
  SUCCESS: {
    // Lead Messages
    LEAD_ADDED: "Lead added successfully",
    LEAD_UPDATED: "Lead updated successfully",
    LEAD_DELETED: "Lead deleted successfully",
    LEAD_DEACTIVATED: "Lead deactivated successfully",
    LEAD_ACTIVATED: "Lead activated successfully",
    LEAD_CONVERTED_TO_PATIENT: "Lead converted to patient successfully",
    LEAD_STATUS_SOURCE_UPDATED: "Lead status and source updated successfully",
    NOTE_ADDED: "Note added successfully",
    CALL_ACTIVITY_ADDED: "Call activity added successfully",

    // Appointment Messages
    APPOINTMENT_SAVED: "Appointment saved successfully",
    APPOINTMENT_CANCELLED: "Appointment cancelled successfully",
    APPOINTMENT_DELETED: "Appointment deleted successfully",
    APPOINTMENT_RESCHEDULED: "Appointment rescheduled successfully",
    SLOT_AVAILABLE: "Slot is available for booking",

    // Patient Messages
    PATIENT_CREATED: "Patient created successfully",
    PATIENT_HISTORY_ADDED: "Patient history added successfully",
    REMINDER_SENT: "Reminder sent successfully",
    REPORT_UPLOADED: "Report uploaded successfully",
    EMAIL_SENT: "Email sent successfully",
    PATIENT_DELETED: "Patient and all related records deleted successfully",

    // Activity Messages
    ACTIVITY_ADDED: "Activity added successfully",

    // Task Messages
    TASK_MARKED_COMPLETE: "Task marked as complete successfully",
    CALL_SCHEDULED: "Call scheduled successfully",

    // User Messages
    OTP_SENT: "OTP sent successfully",
    USER_CREATED: "User created successfully",
    SUPER_ADMIN_CREATED: "Super Admin created successfully",
    PASSWORD_SET: "Your password has been set successfully",
    RESET_PASSWORD_LINK_SENT: "Reset password link sent successfully to your email",
    USER_STATUS_UPDATED: (status: string) => `User ${status.toLowerCase()} successfully`,
    USER_PROFILE_UPDATED: "User profile updated successfully",
    USER_DELETED: "User deleted successfully",

    // Organization Messages
    ORG_CONFIG_SAVED: "Organization configuration saved successfully",
    ORG_CONFIG_CREATED: "Organization configuration created successfully",
    ORGANIZATION_DISABLED: "Organization disabled successfully",
    ORGANIZATION_ENABLED: "Organization enabled successfully",
    S3_UPLOAD_URL_GENERATED: "S3 upload URL generated successfully",
    AUDIO_UPLOADED_TO_WHATSAPP: "Audio uploaded to WhatsApp and document ID stored successfully",
    TESTIMONIAL_UPLOADED_TO_WHATSAPP: "Testimonial data uploaded to WhatsApp and document ID stored successfully",

    // Permission Messages
    USER_PERMISSIONS_UPDATED: "User permissions updated successfully",
    ROLE_PERMISSIONS_UPDATED: "Role permissions updated successfully",

    // Social Messages
    MESSAGE_SENT: "Successfully sent message",

    // General Messages
    SUCCESS: "Success",
    SERVER_RUNNING: "Server is running",
    MESSAGE_PROCESSED: "Message processed and response sent to user",
  },

  // ==================== ERROR MESSAGES ====================
  ERROR: {
    // General Errors
    SOMETHING_WENT_WRONG: "Something went wrong while processing your request",
    TECHNICAL_ERROR: "Some technical error occurred",
    INTERNAL_SERVER_ERROR: "Internal server error",
    VALIDATION_FAILED: "Validation failed",
    REQUEST_FAILED: "Request failed. Please try again or contact admin.",
    NO_DATA_FOUND: "No data found for your request",

    // Authentication Errors
    AUTH_UNSUCCESSFUL: "Authentication unsuccessful.",
    AUTH_FAILED: "Authentication failed",
    AUTH_STRATEGY_NOT_FOUND: (auth: string) => `Authentication strategy ${auth} not found`,
    FORBIDDEN_ACCESS_DENIED: "Forbidden: Access denied",
    AUTH_HEADER_NOT_FOUND: "Authorization header not found.",
    INVALID_BASIC_AUTH: "Please supply a valid basic auth header.",
    SUPPLY_EMAIL: "Please supply your email.",
    SUPPLY_PASSWORD: "Please supply your password.",
    INVALID_LOGIN_CREDENTIALS: "Invalid login credentials",
    MISSING_INFORMATION: "Missing information",
    INVALID_OTP: "Invalid OTP",

    // User Errors
    USER_NOT_FOUND: "User not found",
    ACCOUNT_BLOCKED: "Your account has been blocked. Please contact administrator",
    ACCOUNT_INACTIVE: "Your account is inactive. Please contact administrator",
    ACCOUNT_ALREADY_EXISTS: "Your account already exists in the system",
    ACCOUNT_EXISTS_WITH_ORG: "Your account is already created with organization. Please try to login",
    ORG_NAME_EXISTS: "Organization with same name already exists in the system",
    USER_EXISTS_CANNOT_CONVERT: "User already exists in the system. Cannot convert to patient",
    CHECK_ACCOUNT_WITH_ADMIN: "Please ask admin to check your account",
    ACCOUNT_NOT_CREATED: "Your account is not created. Please ask your admin to register",
    ACCOUNT_BLOCKED_CONTACT_ADMIN: "Your account is blocked. Please contact admin",
    MOBILE_ALREADY_IN_USE: "Mobile number already in use by another user",
    MOBILE_ALREADY_EXISTS: "Mobile number already exists",
    EMAIL_ALREADY_EXISTS: "Email already exists in the system",
    CANNOT_DELETE_SELF: "You cannot delete your own account",
    CANNOT_DELETE_SUPER_ADMIN: "Super admin accounts cannot be deleted",
    CANNOT_DELETE_MAIN_ADMIN: "Main admin of the organization cannot be deleted",
    CANNOT_UPDATE_MAIN_ADMIN_ROLE: "Main admin's role cannot be changed",
    UNAUTHORIZED: "You are not authorized to perform this action",
    ORGANIZATION_NOT_FOUND: "Organization not found",

    // Lead Errors
    LEAD_NOT_FOUND: "Lead not found",
    LEAD_DATA_NOT_FOUND: "Lead data not found",
    LEAD_ALREADY_CONVERTED: "Already converted",
    LEAD_ALREADY_DEACTIVATED: "Lead is already deactivated",
    LEAD_ALREADY_ACTIVATED: "Lead is already activated",
    CANNOT_UPDATE_CONVERTED_LEAD: "You can't update CONVERTED Lead",
    ONLY_NEW_FOLLOWUP_CAN_CONVERT: "Only NEW or FOLLOW_UP leads can be converted to patient",
    INVALID_STATUS_PROVIDED: "Invalid status provided",
    EMAIL_NOT_AVAILABLE: "Email is not available. Please add email first",
    INVALID_LEAD_ID: "Invalid lead ID",
    NO_LEAD_FOR_REFERENCE: "No lead found for the given referenceId",
    CANNOT_SCHEDULE_FOR_DEACTIVATED: "Cannot schedule appointment for deactivated lead",

    // Patient Errors
    PATIENT_NOT_FOUND: "Patient not found ",
    PATIENT_DATA_NOT_FOUND: "Patient data not found",
    NO_PATIENT_FOUND: "No Patient found",
    MULTIPLE_PATIENTS_FOUND: "We found same name with more than 1 patient please select one",
    PATIENT_EMAIL_NOT_AVAILABLE: "Patient email is not available. Please add email first.",
    PATIENT_MOBILE_ALREADY_EXISTS: "A patient with this mobile number already exists in your organization",
    UPLOAD_KEY_NOT_FOUND: "Upload key not found or expired",

    // Appointment Errors
    NO_SLOTS_TODAY: "No Available slots for today. Can you give us time for tomorrow",
    SLOT_ALREADY_BOOKED: "This slot is already booked. Please try another slot",
    SLOT_NOT_AVAILABLE: "This slot is not available, please try another slot",
    CANNOT_BOOK_IN_PAST: "You can't book an appointment in the past.",
    HOSPITAL_CLOSED_TODAY: "Hospital is closed today.",
    HOSPITAL_CLOSED_TOMORROW: "Hospital is closed tomorrow.",
    HOSPITAL_CLOSED_ON_DATE: (date: string) => `Hospital is closed on ${date}.`,
    HOSPITAL_OPEN_ON_DATE: (date: string, slots: string) => `Hospital is open on ${date} during: ${slots}.`,
    INVALID_APPOINTMENT_DATE: "Invalid appointmentDate format",

    // Organization Config Errors
    ORG_CONFIG_NOT_FOUND: "Organization configuration not found",
    INVALID_WORKING_HOURS: "Invalid working hours structure: timezone and days are required",
    INVALID_WORKING_HOURS_DAY: (day: string) => `Invalid working hours for day ${day}: slots must be an array`,
    INVALID_TIME_SLOT: (day: string) => `Invalid time slot for day ${day}: startTime and endTime must be numbers`,
    INVALID_TIME_RANGE: (day: string) => `Invalid time slot for day ${day}: times must be between 0 and 24`,
    INVALID_TIME_ORDER: (day: string) => `Invalid time slot for day ${day}: startTime must be less than endTime`,

    // Permission Errors
    INVALID_PERMISSION: "Invalid permission",

    // Meta/Webhook Errors
    MISSING_SIGNATURE: "Missing signature",
    ORG_ID_NOT_FOUND: "orgId not found in URL",
    INVALID_SIGNATURE: "Not valid signature",
    MISSING_DATA: "Missing data",
    NO_VALID_SESSION: "No valid session ID",
    ERROR_TERMINATING_SESSION: "Error terminating session",

    // Social/Media Errors
    MEDIA_NOT_SUPPORTED: "We are not supporting this type of media",
    LANGUAGE_SELECTION_REQUIRED: "Without language selection, We will not be able to serve you better.",

    // API/Tool Errors
    TARGET_PATH_REQUIRED: "targetPath required for api mode",
    WORKFLOW_INPUT_REQUIRED: "workflowInput required for workflow mode",
    MCP_ACTION_REQUIRED: "mcpAction required for mcp mode",
    UNKNOWN_MODE: "Unknown mode",
    TOOL_EXECUTION_FAILED: "Tool execution failed",
    UNKNOWN_TOOL: (toolName: string) => `Unknown tool: ${toolName}`,
    FAILED_TO_FETCH_LEAD: "Failed to fetch lead",
    FAILED_TO_LIST_LEADS: "Failed to list leads",
    FAILED_TO_CREATE_TASK: "Failed to create task",
    FAILED_TO_LIST_TASKS: "Failed to list tasks",
    FAILED_TO_FETCH_APPOINTMENT: "Failed to fetch appointment",
    FAILED_TO_LIST_APPOINTMENTS: "Failed to list appointments",
    FAILED_TO_FETCH_PATIENT: "Failed to fetch patient",
    FAILED_TO_FETCH_CHAT_HISTORY: "Failed to fetch chat history",
    FAILED_UPLOAD: "Failed upload",
    FAILED_TO_LIST_AGENTS: "Failed to list agents",
    AGENT_NOT_FOUND: "Agent not found",
    FAILED_TO_LOAD_AGENT: "Failed to load agent",
    TRY_NEW_OPERATION: "Please try a new operation",

    // Validation Errors
    EITHER_PATIENT_ID_OR_NAME: "Either patientId or patientName is required",
    EITHER_USER_ID_OR_NAME: "Either userId or userName is required",
    AT_LEAST_ONE_ID_REQUIRED: "At least one of patientId or leadId must be provided",
  },

  // ==================== VALIDATION MESSAGES ====================
  VALIDATION: {
    // Mobile
    MOBILE_NOT_EMPTY: "Mobile number should not be empty",
    MOBILE_ONLY_DIGITS: "Mobile number must contain only digits",
    MOBILE_MAX_LENGTH: "Mobile number must be at most 23 digits",

    // OTP
    OTP_EXACTLY_6_DIGITS: "OTP must be exactly 6 digits",
    OTP_ONLY_NUMBERS: "OTP must contain only numbers",

    // Generic
    INVALID_GENDER: "Invalid gender status",
    DOB_FORMAT: "DOB must be in DD/MM/YYYY format",
    INVALID_LANGUAGE_TYPE: "Invalid language type",
    INVALID_ACTIVITY_TYPE: "Invalid activity type",
    INVALID_PATIENT_ID: "Invalid patientId",
    INVALID_LEAD_ID: "Invalid leadId",
    INVALID_APPOINTMENT_STATUS: "Invalid appointment status",
    INVALID_TYPE: "Invalid type",
    INVALID_CONFIG_ID: "Invalid configId",
    INVALID_ORG_ID: "Invalid orgId",
    INVALID_EXPERIENCE_YEARS: "Invalid experienceYears",
    INVALID_ROLE: "Invalid role provided",
    ROLE_NOT_FOUND: "Role not found in the system",
    ROLE_NOT_ACTIVE: "Role is not active. Please contact administrator",
    ROLE_NOT_ALLOWED: "PATIENT and SUPER_ADMIN roles cannot be assigned to hospital users",
    ORDER_BY_ASC_DESC: "OrderBy can only be ASC or DESC",
    NAME_NOT_EMPTY: "Name should not be empty",

    // URL Validations
    URL_MUST_BE_VALID: "Public URL must be a valid URL",
    AUDIO_URL_MUST_BE_VALID: "Audio public URL must be a valid URL",
    AUDIO_URL_MUST_BE_MP3: "Audio public URL must be an MP3 file URL",

    // Organization Config
    TIMEZONE_NOT_EMPTY: "Timezone should not be empty",
    DAYS_CONFIG_REQUIRED: "Days configuration is required",
    WHATSAPP_TEMPLATE_ID_REQUIRED: "WhatsApp template id is required",
    WHATSAPP_TEMPLATE_LANG_REQUIRED: "WhatsApp template languageCode is required",
    WHATSAPP_TOKEN_REQUIRED: "WhatsApp token is required",
    WHATSAPP_PHONE_ID_REQUIRED: "WhatsApp phoneNumberId is required",
    WHATSAPP_TEMPLATE_REQUIRED: "WhatsApp template is required",
    FOLLOWUP_MSG_TEMPLATE_REQUIRED: "Follow up message template is required",
    MESSENGER_PAGE_ID_REQUIRED: "Messenger pageId is required",
    INSTAGRAM_TOKEN_REQUIRED: "Instagram token is required",
    INSTAGRAM_USER_ID_REQUIRED: "Instagram userId is required",
    BASE_URL_REQUIRED: "Base URL is required",
    PHONE_NUMBER_ID_REQUIRED: "Phone number ID is required",
    WHATSAPP_AGENTS_URL_REQUIRED: "WhatsApp agents URL is required",
    VERSION_REQUIRED: "Version is required",
    APP_SECRET_REQUIRED: "App secret is required",
    USER_ACCESS_TOKEN_REQUIRED: "User access token is required",
    FB_LEAD_CONFIG_REQUIRED: "Facebook lead configuration is required",
    WHATSAPP_CONFIG_REQUIRED: "WhatsApp configuration is required",
    MESSENGER_CONFIG_REQUIRED: "Messenger configuration is required",
    INSTAGRAM_CONFIG_REQUIRED: "Instagram configuration is required",
    SUPPORT_MEDIA_TYPE_REQUIRED: "Support media type is required",
    WORKING_HOURS_REQUIRED: "Working hours is required",
    META_ATTRIBUTES_REQUIRED: "Meta attributes is required",
    START_TIME_RANGE: "Start time must be between 0 and 24",
    END_TIME_RANGE: "End time must be between 0 and 24",

    // Task/Schedule
    ASSIGN_TO_USER_NOT_EMPTY: "Assign to user ID should not be empty",

    // Roles
    ROLES_MIN_ONE: "Roles must contain at least one role",
    ONLY_ONE_ROLE: "Only one role is allowed when creating user",
    EACH_ROLE_VALID: "Each role should be valid",
    ROLES_NOT_EMPTY: "Roles array should not be empty",
    ROLE_USER_ADMIN_ONLY: "Role can only be ADMIN, USER, or other defined roles",

    // Status/Source
    STATUS_VALID: "Status should be valid like NEW, NOT_PICKUP, NOT_INTERESTED, FOLLOW_UP, CONVERTED, DROPPED, DEACTIVATED",
    SOURCE_VALID: "Source should be valid like WALK_IN, CALL, WEBSITE, REFERRAL, SOCIAL_MEDIA, OTHER",
    STATUS_ENUM: "Status must be one of: NEW, NOT_PICKUP, NOT_INTERESTED, FOLLOW_UP, CONVERTED, DROPPED, DEACTIVATED",
    APPOINTMENT_STATUS_ENUM: "Status must be PENDING, COMPLETED, or CANCELLED",

    // Report
    REPORT_ID_INTEGER: "Each reportId must be an integer",
    REPORT_ID_POSITIVE: "Each reportId must be greater than 0",

    // Message
    MESSAGE_NOT_EMPTY: "Message cannot be empty",

    // Medicine
    MEDICINE_NAME_STRING: "Medicine name must be a string",
    MEDICINE_DESC_STRING: "Medicine description must be a string",
    PRICE_NUMBER: "Price must be a number",
    PRICE_MIN_ZERO: "Price must be greater than or equal to 0",

    // Permission
    PERMISSION_ID_MIN: "Permission ID must be greater than or equal to 1",

    // History
    CONDITION_STRING: "Condition must be a string",
  },

  // ==================== SPECIAL/CONTEXTUAL MESSAGES ====================
  SPECIAL: {
    WELCOME_MESSAGE: "WELCOME MESSAGE",
    SEND_WELCOME_MESSAGE: "SEND WELCOME MESSAGE TO USER",
    SEND_APPOINTMENT_CONFIRMATION: "SEND APPOINTMENT CONFIRMATION TO USER",
    SEND_ADDRESS_TO_USER: "SEND ADDRESS TO TO USER",
     SEND_APPOINTMENT_CANCEL_CONFIRMATION: "SEND APPOINTMENT CANCEL CONFIRMATION TO USER",
    DATA_PRINT: "DATA PRINT",
  },

  // ==================== WHATSAPP API MESSAGES ====================
  WHATSAPP: {
    API_ERROR: "Something went wrong with WhatsApp API",
    MEDIA_URL_NOT_FOUND: "Media URL not found",
  },

  // ==================== CHAT CONTROLLER MESSAGES ====================
  CHAT: {
    SESSION_ID_REQUIRED: "Session ID is required",
    NO_FILE_UPLOADED: "No file uploaded",
  },

  // ==================== MCP/ROUTER MESSAGES ====================
  MCP: {
    INTERNAL_SERVER_ERROR: "Internal server error",
  },

  // ==================== ENCRYPTION MESSAGES ====================
  ENCRYPTION: {
    DECRYPTION_ERROR: "Something went wrong. Please ask admin to check it",
  },

  // ==================== APPOINTMENT TYPE MESSAGES ====================
  APPOINTMENT_TYPE: {
    CONSULTATION_FOLLOWUP_EXTRA: "Appointment type must be CONSULTATION, FOLLOW_UP, or EXTRA",
    DIRECTION_INBOUND_OUTBOUND: "Direction must be INBOUND or OUTBOUND",
    CALL_ID_OR_SID_REQUIRED: "Either callId or sid must be provided",
  },

  // ==================== AGENT SOURCE MESSAGES ====================
  AGENT: {
    SOURCE_VALID: "source should be valid like WALK_IN, CALL, WEBSITE, REFERRAL, SOCIAL_MEDIA, OTHER, WHATSAPP, INSTAGRAM, FACEBOOK",
    LEAD_ID_OR_REFERENCE_REQUIRED: "Either leadId or referenceId is required",
    APPOINTMENT_ID_OR_REFERENCE_REQUIRED: "Either appointmentId or referenceId is required",
  },

  // ==================== HISTORY MESSAGES ====================
  HISTORY: {
    NOTES_STRING: "Notes must be a string",
  },
} as const;

// Type for accessing message keys
export type MessageKey = keyof typeof Messages;
export type SuccessMessageKey = keyof typeof Messages.SUCCESS;
export type ErrorMessageKey = keyof typeof Messages.ERROR;
export type ValidationMessageKey = keyof typeof Messages.VALIDATION;
