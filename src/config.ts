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
  BACKEND_URL: environment.BACKEND_URL ?? '',
  SERVER_UI_URL: environment.SERVER_UI_URL ?? '',
  PORT: Number(environment.PORT) || 3000,

  environment: String(environment.NODE_ENV) ?? 'demo-dev',

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

const secretCryptoConfig = {
  key: environment.STRIPE_SECRETS_KEY ?? '',
  isEnable: Boolean(environment.STRIPE_SECRETS_KEY),
}


const servedOverHttps = String(environment.SERVE_OVER_HTTPS) === 'true'
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
      // helmet's CSP runs with useDefaults:true, and `upgrade-insecure-requests`
      // is one of those built-in defaults — so simply *not* adding it here is NOT
      // enough; helmet injects it anyway. To actually DROP a default directive you
      // must set it to `null`. Enable it ([]) only when truly served over HTTPS;
      // otherwise force it off so plain-HTTP deploys aren't upgraded to a broken
      // https URL (ERR_SSL_PROTOCOL_ERROR on every asset).
      upgradeInsecureRequests: servedOverHttps ? [] : null,
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
  contestRequireAttribute,
  helmetConfig
}
