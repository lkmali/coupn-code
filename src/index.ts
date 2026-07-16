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
import { loadClassesFrom, setLogger } from './utils'
import { envConfig, helmetConfig } from './config'
import { requestContextMiddleware, requestLoggerMiddleware } from './provider'
import { LoggerProvider } from './provider/logger.provider'
import { mongoConnection } from './database/connection/mongoConnection'

const app = express()
app.set('etag', false)
const logger = LoggerProvider.Instance.logger
setLogger(logger as any)

async function loadServer() {
  app.set('trust proxy', true)
  app.use(requestContextMiddleware)
  app.use(requestLoggerMiddleware)
  new CorsProvider().corsRequest(app)

  try {
    await mongoConnection.connect()
    logger.info('MongoDB connected successfully')
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error)
  }

  app.use(helmet(helmetConfig as any))
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))

  const controllers = loadClassesFrom(path.join(__dirname, 'controllers'))
  const middlewares = loadClassesFrom(path.join(__dirname, 'middlewares'))

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
  } else {
    logger.warn(`UI build not found at ${uiDir}. Run "npm run build:ui" to generate it.`)
  }

  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    res.status(err.status || 500).json({ err: err.message ?? 'Internal Server Error' })
  })

  const server = app.listen(envConfig.PORT, () => {
    logger.info(`Server is running on port ${envConfig.PORT}`)
  })

  process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received: closing HTTP server')
    server.close(async () => {
      logger.info('HTTP server closed')
      await mongoConnection.disconnect()
      logger.info('MongoDB connection closed')
      process.exit(0)
    })
  })
}

loadServer().catch(error => {
  logger.error('Error loading server: ', error)
  process.exit(1)
})
