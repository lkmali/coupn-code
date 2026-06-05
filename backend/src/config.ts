import { load } from 'dotenv-extended'
import { Algorithm } from 'jsonwebtoken'
import { Role } from './typings'
const environment = load({
  errorOnExtra: true,
  errorOnRegex: true,
  includeProcessEnv: true,
})
const envConfig = {
  ALLOWED_ORIGINS: environment.ALLOWED_ORIGINS ? environment.ALLOWED_ORIGINS.split(',') : ['*'],
  JWT_AUDIENCE: environment.JWT_AUDIENCE ?? 'annantai',
  JWT_ISSUER: environment.JWT_ISSUER ?? 'annantai',
  PASSWORD_ROUNDS: Number(environment.PASSWORD_ROUNDS ?? 10),
  JWT_ALGO: (environment.JWT_ALGO ?? 'HS256') as Algorithm,
  JWT_EXPIRES_IN: Number(environment.JWT_EXPIRES_IN ?? 3600) ?? '1h',
  NETWORK_WEBHOOK_SECRET: environment.NETWORK_WEBHOOK_SECRET ?? 'annantai',
  WEBSITE_URL: environment.WEBSITE_URL ?? 'http://localhost:3000',
  APP_TESTING_OTP: environment.APP_TESTING_OTP,
  APP_TESTING_MOBILE: environment.APP_TESTING_MOBILE,
  TEST_MODE: String(environment.TEST_MODE) === 'true',
  OPENAI_API_KEY: environment.OPENAI_API_KEY ?? '',
  BACKEND_URL: environment.BACKEND_URL ?? '',
  SERVER_UI_URL: environment.SERVER_UI_URL ?? '',
  PORT: Number(environment.PORT) || 3000,
  redisPriFix: String(environment.REDIS_PRI_FIX) ?? 'demo-dev',
  environment: String(environment.NODE_ENV) ?? 'demo-dev',
  EMAIL_TEST_MODE: String(environment.EMAIL_TEST_MODE) === 'true',
  BOT_TOKEN_NETWORK: String(environment.BOT_TOKEN_NETWORK) ?? '',
  BOT_EXPIRES_IN: Number(environment.BOT_EXPIRES_IN) || 31536000,
  PATIENT_JWT_SECRET: String(environment.PATIENT_JWT_SECRET ?? environment.NETWORK_WEBHOOK_SECRET ?? 'annantai-patient'),
  PATIENT_JWT_EXPIRES_IN: Number(environment.PATIENT_JWT_EXPIRES_IN) || 2592000,
  PATIENT_OTP_EXPIRY_MINUTES: Number(environment.PATIENT_OTP_EXPIRY_MINUTES) || 10,
  SLOT_DEFAULT_DURATION: Number(environment.SLOT_DEFAULT_DURATION ?? 30),
  // Google OAuth (for Gmail integration)
  GOOGLE_CLIENT_ID: environment.GOOGLE_CLIENT_ID ?? '',
  GOOGLE_CLIENT_SECRET: environment.GOOGLE_CLIENT_SECRET ?? '',
  LAMBDA_ACCESS_KEY_ID: environment.LAMBDA_ACCESS_KEY_ID ?? '',
  LAMBDA_SECRET_ACCESS_KEY: environment.LAMBDA_SECRET_ACCESS_KEY ?? '',
  LAMBDA_BASE_URL: environment.LAMBDA_BASE_URL ?? 'http://localhost:4000',
  AI_MODEL_SERVICE_URL: environment.AI_MODEL_SERVICE_URL ?? 'http://localhost:8000',
}

const defaultOrganizationInformation = {
  adminName: environment.ADMIN_NAME ?? 'Anant AI',
  adminEmail: environment.ADMIN_EMAIL ?? 'ai@anantkaya.com',
  adminPhone: environment.ADMIN_PHONE ?? '89845585858',
}

const constantConfig = {
  OTP_LENGTH: 6,
  logOption: {
    level: 'debug',
    maxFiles: 120,
    datePattern: 'DD-MM-YYYY',
  },
  consoleTransportOptions: {
    level: 'info',
    handleExceptions: true,
  },
}

const agentsConfig = {
  agentUrl: environment.AGENTS_URL
}

const redisConfig = {
  host: environment.REDIS_HOST || 'localhost',
  port: Number(environment.REDIS_PORT) || 6379,
  password: environment.REDIS_PASSWORD,
  username: environment.REDIS_USER,
  db: Number(environment.REDIS_DB) || 0,
  useQueue: String(environment.USE_QUEUE) === 'true',
  useRedis: String(environment.USE_REDIS) === 'true',
  useCluster: String(environment.REDIS_USE_CLUSTER) === 'true',
  clusterNodes: environment.REDIS_CLUSTER_NODES, // Comma-separated: "host1:port1,host2:port2"
}

const chatkitConfig = {
  workflowId: environment.CHATKIT_WORKFLOW_ID ?? '',
  apiKey: environment.OPENAI_API_KEY ?? '',
  backendAppUrl: environment.BACKEND_URL ?? 'http://localhost:3000',
  basePath: '/chatkit',
  sessionPath: '/chatkit/session',
  toolsPath: '/chatkit/tools1',
  workflowRunPath: '/chatkit/workflow/run',
  generatorOutput: 'chatkit-tools.generated.json',
}

const queueConfig = {
  enabled: String(environment.USE_QUEUE) === 'true',
  concurrency: Number(environment.QUEUE_CONCURRENCY) || 1,
  maxRetries: Number(environment.QUEUE_MAX_RETRIES) || 3,
  retryDelay: Number(environment.QUEUE_RETRY_DELAY) || 5000,
  removeOnComplete: Number(environment.QUEUE_REMOVE_ON_COMPLETE) || 100,
  removeOnFail: Number(environment.QUEUE_REMOVE_ON_FAIL) || 100,
  useQueue: String(environment.USE_QUEUE) === 'true',
}

const configMongoDb = {
  uri: environment.MONGO_URI || 'mongodb://localhost:27017/annantai',
  options: {
    maxPoolSize: 10,
    minPoolSize: 2,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  },
}


const actionMap: Record<number, string> = {
  1: 'VIEW',
  2: 'EDIT',
  3: 'DELETE',
  4: 'ALL',
}

const encryptionConfig = {
  algorithm: '',
  key: '',
  iv: '',
  isEnable: false,
}

const awsConfigurationKey = {
  config: {
    accessKeyId: environment.AWS_ACCESS_KEY_ID,
    secretAccessKey: environment.AWS_SECRET_ACCESS_KEY,
    region: environment.AWS_REGION,
    signatureVersion: 'v4',
  },
  s3Config: {
    bucketName: environment.AWS_S3_PRIVATE_BUCKET_NAME ?? '',
    publicBucketName: environment.AWS_S3_PUBLIC_BUCKET_NAME || 'anantkaya-files',
    publicBucketAccessId: environment.PUBLIC_BUCKET_AWS_ACCESS_KEY_ID,
    publicBucketSecretAccessKey: environment.PUBLIC_BUCKET_AWS_SECRET_ACCESS_KEY,
    expireTimeForPrivateUrl: 3600,
    publicUrl: `https://${environment.AWS_S3_PUBLIC_BUCKET_NAME}.s3.${environment.AWS_REGION}.amazonaws.com`,
  },
  sesEmail: {
    from: environment.EMAIL_SENDER_ADMIN ?? 'noreply@aiplustechnology.com',
  },
}

const helmetConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'blob:', '*'],
      styleSrc: ["'self'", "'unsafe-inline'", 'fonts.googleapis.com', 'cdn.jsdelivr.net'],
      styleSrcElem: ["'self'", "'unsafe-inline'", 'fonts.googleapis.com', 'cdn.jsdelivr.net'],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'cdn.jsdelivr.net'],
      scriptSrcElem: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'cdn.jsdelivr.net'],
      scriptSrcAttr: ["'unsafe-inline'"],
      // objectSrc: ["'self'"],
      fontSrc: ["'self'", 'fonts.googleapis.com', 'fonts.gstatic.com', 'data:'],
      upgradeInsecureRequests: [],
      reportUri: '/report-violation',
      connectSrc: ["'self'", 'http://localhost:4000', 'http://localhost:4001', 'http://localhost:4002', 'https://anantkaya-files.s3.ap-south-1.amazonaws.com'],
    },
  },
  referrerPolicy: {
    policy: 'same-origin',
  },
}


const contestRequireAttribute = {
  orgId: {
    type: 'number',
    description: 'origination id ',
    minimum: 1,
  },
  userId: {
    type: 'string',
    description: 'login user Id ',
  },
  role: {
    type: 'string',
    description: 'login role ',
  },
}

export const openapiConfiguration = {}
export const HospitalRole: Role[] = [
  Role.ADMIN,
  Role.DOCTOR,
  Role.NURSE,
  Role.RECEPTIONIST,
  Role.ADMIN,
  Role.CEO,
  Role.TECHNICIAN,
  Role.PATIENT,
  Role.LAB_ASSISTANT,
  Role.TELECALLER
]

export {
  envConfig,
  constantConfig,
  configMongoDb,
  agentsConfig,
  actionMap,
  defaultOrganizationInformation,
  encryptionConfig,
  awsConfigurationKey,
  contestRequireAttribute,
  helmetConfig,
  redisConfig,
  queueConfig,
  chatkitConfig,
}
