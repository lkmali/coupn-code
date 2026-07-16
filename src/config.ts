import { load } from 'dotenv-extended'
const environment = load({
  errorOnExtra: true,
  errorOnRegex: true,
  includeProcessEnv: true,
})

const envConfig = {
  ALLOWED_ORIGINS: environment.ALLOWED_ORIGINS ? environment.ALLOWED_ORIGINS.split(',') : ['*'],
  WEBSITE_URL: environment.WEBSITE_URL ?? 'http://localhost:3000',
  PORT: Number(environment.PORT) || 3000,
  environment: String(environment.NODE_ENV) ?? 'demo-dev',
}

const constantConfig = {
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

const configMongoDb = {
  uri: environment.MONGO_URI || 'mongodb://localhost:27017/intgration-demo',
  options: {
    maxPoolSize: 10,
    minPoolSize: 2,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  },
}

const servedOverHttps = String(environment.SERVE_OVER_HTTPS) === 'true'
const helmetConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'blob:', '*'],
      styleSrc: ["'self'", "'unsafe-inline'", 'fonts.googleapis.com'],
      styleSrcElem: ["'self'", "'unsafe-inline'", 'fonts.googleapis.com'],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      scriptSrcElem: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      scriptSrcAttr: ["'unsafe-inline'"],
      fontSrc: ["'self'", 'fonts.googleapis.com', 'fonts.gstatic.com', 'data:'],
      reportUri: '/report-violation',
      connectSrc: ["'self'"],
      // helmet's CSP runs with useDefaults:true, and `upgrade-insecure-requests`
      // is one of those built-in defaults — so simply *not* adding it here is NOT
      // enough; helmet injects it anyway. To actually DROP a default directive you
      // must set it to `null`. Enable it ([]) only when truly served over HTTPS;
      // otherwise force it off so plain-HTTP deploys aren't upgraded to a broken
      // https url (ERR_SSL_PROTOCOL_ERROR on every asset).
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

export { envConfig, constantConfig, configMongoDb, helmetConfig }
