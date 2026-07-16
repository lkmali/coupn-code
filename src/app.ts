import 'reflect-metadata'
import express from 'express'
import path from 'path'
import fs from 'fs'
import helmet from 'helmet'
import swaggerUi from 'swagger-ui-express'
import { useExpressServer, getMetadataArgsStorage } from 'routing-controllers'
import { routingControllersToSpec } from 'routing-controllers-openapi'
import { validationMetadatasToSchemas } from 'class-validator-jsonschema'
import { CorsProvider } from './provider/cors'
import { setLogger } from './utils'
import { helmetConfig } from './config'
import { requestContextMiddleware, requestLoggerMiddleware } from './provider'
import { LoggerProvider } from './provider/logger.provider'
import { mongoConnection } from './database/connection/mongoConnection'
import { UserController } from './controllers/userController'
import { CustomErrorHandler } from './middlewares/CustomErrorHandler'

// Controllers and middlewares are listed explicitly rather than discovered by
// scanning the filesystem. A bundler (Vercel/esbuild) traces static imports
// only, so a require() built from readdirSync leaves these files out of the
// deployment and throws ENOENT on the first request.
const controllers = [UserController]
const middlewares = [CustomErrorHandler]

const logger = LoggerProvider.Instance.logger
setLogger(logger as any)

const app = express()
app.set('etag', false)
app.set('trust proxy', true)

app.use(requestContextMiddleware)
app.use(requestLoggerMiddleware)
new CorsProvider().corsRequest(app)

app.use(helmet(helmetConfig as any))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// A serverless invocation gets no startup hook, so the database connection is
// established on the first request that needs it and reused by every later
// request that lands on the same warm instance. `connect()` is idempotent and
// caches internally; awaiting it here also means a connection failure surfaces
// as a 500 through the error handler rather than as a silent partial boot.
// Scoped to '/api' so that /health, /docs and the static UI stay answerable
// while the database is unreachable — a health check that needs Mongo can't
// tell you that Mongo is what's down.
let connectionPromise: Promise<unknown> | null = null
app.use('/api', (_req, _res, next) => {
  if (!connectionPromise) {
    connectionPromise = mongoConnection.connect().catch(error => {
      // Clear the cache so the next request retries instead of reusing a
      // permanently rejected promise.
      connectionPromise = null
      throw error
    })
  }
  connectionPromise.then(() => next()).catch(next)
})

useExpressServer(app, {
  controllers,
  routePrefix: '/api',
  middlewares,
  defaultErrorHandler: false,
  classTransformer: true,
  defaults: {
    undefinedResultCode: 200,
  },
  validation: {
    whitelist: true, // Removes extra properties not in DTO
    forbidNonWhitelisted: true, // Throws error if extra properties are sent
  },
})

const schemas = validationMetadatasToSchemas({
  refPointerPrefix: '#/components/schemas/',
})
const spec = routingControllersToSpec(
  getMetadataArgsStorage(),
  { routePrefix: '/api', controllers },
  {
    components: { schemas },
    info: {
      title: 'Coupon User API',
      version: '1.0.0',
    },
  },
)

app.use('/docs', swaggerUi.serve, swaggerUi.setup(spec))

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Serve the Next.js UI (static export) from the SAME origin as the API, so the
// UI's "/api/*" calls hit this server directly — no CORS, no cross-port routing.
// On Vercel this directory is absent from the function bundle and the UI is
// served by the platform's static layer instead (see vercel.json), so the block
// below is a local-run concern only.
const uiDir = path.join(__dirname, '../../UI/out')
if (fs.existsSync(uiDir)) {
  app.post('/report-violation', (_req, res) => res.sendStatus(204))

  app.use(express.static(uiDir, { extensions: ['html'], index: 'index.html' }))

  // SPA fallback. Next's export writes one HTML file per route ("settings.html",
  // NOT "settings/index.html"); express.static resolves "/settings" via
  // `extensions: ['html']`, but a trailing slash is treated as a directory
  // request and misses — so resolve the route file here before defaulting to
  // the shell, otherwise a refresh on "/settings/" serves the Home bundle.
  app.get(/^\/(?!api\/|docs\b|health\b|report-violation\b).*/, (req, res, next) => {
    if (req.method !== 'GET') return next()

    const cleanPath = req.path.replace(/\/+$/, '')
    if (cleanPath && cleanPath !== '/') {
      const candidates = [path.join(uiDir, `${cleanPath}.html`), path.join(uiDir, cleanPath, 'index.html')]
      for (const file of candidates) {
        // Guard against path traversal escaping the UI directory.
        if (file.startsWith(uiDir) && fs.existsSync(file)) {
          return res.sendFile(file)
        }
      }
    }

    res.sendFile(path.join(uiDir, 'index.html'))
  })
}

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled request error', err)
  res.status(err.status || 500).json({ err: err.message ?? 'Internal Server Error' })
})

export { app, logger }
export default app
