import { load } from 'dotenv-extended'
import { Algorithm } from 'jsonwebtoken'
const environment = load({
  errorOnExtra: true,
  errorOnRegex: true,
  includeProcessEnv: true,
})
const envConfig = {
  ALLOWED_ORIGINS: environment.ALLOWED_ORIGINS ? environment.ALLOWED_ORIGINS.split(',') : ['*'],
  JWT_AUDIENCE: environment.JWT_AUDIENCE ?? 'intgration-demo',
  JWT_ISSUER: environment.JWT_ISSUER ?? 'intgration-demo',
  PASSWORD_ROUNDS: Number(environment.PASSWORD_ROUNDS ?? 10),
  JWT_ALGO: (environment.JWT_ALGO ?? 'HS256') as Algorithm,
  JWT_EXPIRES_IN: Number(environment.JWT_EXPIRES_IN ?? 3600) ?? '1h',
  NETWORK_WEBHOOK_SECRET: environment.NETWORK_WEBHOOK_SECRET ?? 'intgration-demo',
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
  // Google OAuth (for Gmail integration)
  GOOGLE_CLIENT_ID: environment.GOOGLE_CLIENT_ID ?? '',
  GOOGLE_CLIENT_SECRET: environment.GOOGLE_CLIENT_SECRET ?? ''
}

const defaultOrganizationInformation = {
  adminName: environment.ADMIN_NAME ?? '7 soft demo',
  adminEmail: environment.ADMIN_EMAIL ?? 'laxmanmaasawa9312@gmail.com',
  adminPhone: environment.ADMIN_PHONE ?? '8442033493',
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


const configMongoDb = {
  uri: environment.MONGO_URI || 'mongodb://localhost:27017/intgration-demo',
  options: {
    maxPoolSize: 10,
    minPoolSize: 2,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  },
}




const encryptionConfig = {
  algorithm: '',
  key: '',
  iv: '',
  isEnable: false,
}

// Dedicated key for encrypting third-party secrets (e.g. per-org Stripe API
// keys) at rest in the configuration DB. Kept separate from `encryptionConfig`
// so enabling secret encryption never alters the legacy OTP cipher behaviour.
// When STRIPE_SECRETS_KEY is empty, secrets are stored as-is (a startup warning
// is logged) so local development still works without extra setup.
const secretCryptoConfig = {
  key: environment.STRIPE_SECRETS_KEY ?? '',
  isEnable: Boolean(environment.STRIPE_SECRETS_KEY),
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

// Only force HTTP -> HTTPS upgrades when the app is ACTUALLY served over TLS.
// NODE_ENV is the wrong signal: a production build can still be served over
// plain http:// (e.g. behind no TLS terminator, or on a raw IP:port). In that
// case emitting `upgrade-insecure-requests` makes the browser rewrite every
// request to https://<host>:<port> — which has no TLS — and fail with
// "Unsafe attempt to load URL https://.../ from frame with URL http://..."
// plus ERR_SSL_PROTOCOL_ERROR on every asset. Gate on an explicit flag that is
// only true when there is a real HTTPS endpoint (set SERVE_OVER_HTTPS=true once
// TLS / a reverse proxy is in front of the app).
const servedOverHttps = String(environment.SERVE_OVER_HTTPS) === 'true'

console.log("SERVE_OVER_HTTPS =", environment.SERVE_OVER_HTTPS,servedOverHttps);

const helmetConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'blob:', '*'],
      styleSrc: ["'self'", "'unsafe-inline'", 'fonts.googleapis.com', 'cdn.jsdelivr.net'],
      styleSrcElem: ["'self'", "'unsafe-inline'", 'fonts.googleapis.com', 'cdn.jsdelivr.net'],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'cdn.jsdelivr.net', 'https://js.stripe.com'],
      scriptSrcElem: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'cdn.jsdelivr.net', 'https://js.stripe.com'],
      scriptSrcAttr: ["'unsafe-inline'"],
      // objectSrc: ["'self'"],
      fontSrc: ["'self'", 'fonts.googleapis.com', 'fonts.gstatic.com', 'data:'],
      // Stripe Elements / 3-D Secure render inside iframes served from these origins.
      frameSrc: ["'self'", 'https://js.stripe.com', 'https://hooks.stripe.com'],
      reportUri: '/report-violation',
      connectSrc: ["'self'", 'http://localhost:4000', 'http://localhost:4001', 'http://localhost:4002', 'http://140.245.233.90:3000', 'https://api.stripe.com'],
      // Spread the upgrade directive only when actually served over HTTPS, so
      // plain-HTTP deployments are never force-upgraded to a broken https URL.
      ...(servedOverHttps ? { upgradeInsecureRequests: [] } : {}),
    },
  },
  // helmet enables HSTS (Strict-Transport-Security) by DEFAULT. Sending it over
  // plain HTTP is wrong and, worse, the browser CACHES it for max-age (1 year),
  // so it keeps force-upgrading http -> https long after the server stops
  // sending it. Only send HSTS when actually served over TLS.
  ...(servedOverHttps ? {} : { strictTransportSecurity: false as const }),
  referrerPolicy: {
    policy: 'same-origin',
  },
}
console.log("HELMET CONFIG", helmetConfig);


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

export {
  envConfig,
  constantConfig,
  configMongoDb,
  agentsConfig,
  defaultOrganizationInformation,
  encryptionConfig,
  secretCryptoConfig,
  awsConfigurationKey,
  contestRequireAttribute,
  helmetConfig,
  redisConfig
}
