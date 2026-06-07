import 'reflect-metadata'
import express from 'express'
import { MigrationObserver } from './observers/migration.observer'
import { CorsProvider } from './provider/cors'
import { useExpressServer, getMetadataArgsStorage } from 'routing-controllers'
import { routingControllersToSpec } from 'routing-controllers-openapi'
import swaggerUi from 'swagger-ui-express'
import { validationMetadatasToSchemas } from 'class-validator-jsonschema'
import { loadClassesFrom } from './utils'
import path from 'path'
import { envConfig, helmetConfig } from './config'
import { requestContextMiddleware, requestLoggerMiddleware,setRedisService } from './provider'
import helmet from 'helmet'
import { timezoneMiddleware } from './middleware/timezone.middleware'
import { rateLimit } from './middleware/rateLimit.middleware'
import { LoggerProvider } from './provider/logger.provider'
import { setLogger } from './utils'
import { loadAllServer } from './mcp/sdk/server'
import yaml from 'js-yaml'
import fs from 'fs'
const app = express()
app.set('etag', false)
const logger = LoggerProvider.Instance.logger
// Bridge Winston logger to @anantai/common so repositories use it
setLogger(logger as any)
// Bridge Redis service to @anantai/common for counter model
import { RedisService } from './service/redis.service'
import {mongoConnection} from './database/connection/mongoConnection'
setRedisService(RedisService.Instance as any)
/**
 * Extract body parameters from a Lambda handler source file by parsing
 * destructured properties from `const { ... } = body` or `JSON.parse(event.body`.
 */
function extractBodyParams(filePath: string): Array<{ name: string; required: boolean; hint: string }> {
  try {
    if (!fs.existsSync(filePath)) return []
    const src = fs.readFileSync(filePath, 'utf8')
    const params: Array<{ name: string; required: boolean; hint: string }> = []

    // Match: const { orgId, code, redirectUri } = body  OR  const { orgId, provider = 'google' } = body
    const destructureMatch = src.match(/const\s*\{([^}]+)\}\s*=\s*(?:body|JSON\.parse\(event\.body)/g)
    if (destructureMatch) {
      for (const match of destructureMatch) {
        const inner = match.match(/\{([^}]+)\}/)?.[1] || ''
        inner.split(',').forEach(p => {
          const trimmed = p.trim()
          if (!trimmed) return
          // Handle default values: provider = 'google'
          const [name, defaultVal] = trimmed.split('=').map(s => s.trim())
          if (name) {
            params.push({
              name,
              required: !defaultVal,
              hint: defaultVal ? `default: ${defaultVal}` : '',
            })
          }
        })
      }
    }

    // Also check for explicit body.fieldName access
    const bodyAccessMatches = src.matchAll(/body\.(\w+)/g)
    for (const m of bodyAccessMatches) {
      const name = m[1]
      if (!params.find(p => p.name === name)) {
        // Check if there's a required validation: if (!body.field) return error(...)
        const requiredPattern = new RegExp(`if\\s*\\(\\s*!\\s*body\\.${name}`)
        params.push({
          name,
          required: requiredPattern.test(src),
          hint: '',
        })
      }
    }

    // Mark params that have explicit required checks: if (!orgId)
    params.forEach(p => {
      const requiredCheck = new RegExp(`if\\s*\\(\\s*!\\s*${p.name}\\s*\\)`)
      if (requiredCheck.test(src)) p.required = true
    })

    return params
  } catch {
    return []
  }
}

async function loadServer() {
  app.set('trust proxy', true)
  app.use(requestContextMiddleware)
  app.use(requestLoggerMiddleware)
  app.use(timezoneMiddleware)
  new CorsProvider().corsRequest(app)

  // Initialize MongoDB connection (must be before MigrationObserver which queries DB)
  try {
    await mongoConnection.connect()
    logger.info('MongoDB connected successfully')
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error)
    // Don't exit - allow app to continue starting even if MongoDB fails
  }

  await MigrationObserver.getInstance().start()


  app.use(helmet(helmetConfig as any))
  app.use(
    express.json({
      verify: (req: any, _res, buf) => {
        req.rawBody = buf.toString()
      },
    }),
  )
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))
  await loadAllServer(app)


  // CSP violation report endpoint


  // Rate limiting for payment & order routes (spec: 100 req / 15 min, plus a
  // stricter 10 / min on payment-intent creation). Mounted before the
  // routing-controllers routes so it runs ahead of controller handlers.
  app.use('/api/orders', rateLimit({ windowSec: 900, max: 100, scope: 'orders' }))
  app.use('/api/payments', rateLimit({ windowSec: 900, max: 100, scope: 'payments' }))
  app.use('/api/payments/create-intent', rateLimit({ windowSec: 60, max: 10, scope: 'payment-create' }))

  const controllers = loadClassesFrom(path.join(__dirname, 'controllers'))
  const middlewares = loadClassesFrom(path.join(__dirname, 'middlewares'))

  // Sort controller metadata so more-specific routes (e.g. /treatment/task)
  // are registered before parameterized routes (e.g. /treatment/:planId)
  getMetadataArgsStorage().controllers.sort((a, b) => {
    const aRoute = (a.route || '') as string
    const bRoute = (b.route || '') as string
    return bRoute.length - aRoute.length
  })

  useExpressServer(app, {
    controllers,
    routePrefix: '/api',
    middlewares,
    defaultErrorHandler: false,
    classTransformer: true, // ✅ Enables class-transformer decorators like @CleanOptional()
    defaults: {
      undefinedResultCode: 200, // Returns 200 instead of 404 when handler returns undefined
    },
    validation: {
      whitelist: true, // 🚫 Removes extra properties not in DTO
      forbidNonWhitelisted: true, // ❌ Throws error if extra properties are sent
    },
    currentUserChecker: async action => {
      return action.request.user // set in middleware
    },
  })
  const schemas = validationMetadatasToSchemas({
    refPointerPrefix: '#/components/schemas/',
  })
  const storage = getMetadataArgsStorage()
  const spec = routingControllersToSpec(
    storage,
    {
      routePrefix: '/api',
      controllers,
    },
    {
      components: {
        schemas,
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
          basicAuth: {
            type: 'http',
            scheme: 'basic',
            description: 'Enter your email as username and password. After login, the JWT token will be auto-set.',
          },
        },
        parameters: {
          latitude: {
            in: 'header',
            name: 'latitude',
            required: false,
            schema: { type: 'string', example: '849.899800' },
          },
          longitude: {
            in: 'header',
            name: 'longitude',
            required: false,
            schema: { type: 'string', example: '849.899800' },
          },
          deviceName: {
            in: 'header',
            name: 'deviceName',
            required: false,
            schema: { type: 'string', example: 'OnePlus' },
          },
          deviceType: {
            in: 'header',
            name: 'deviceType',
            required: false,
            schema: { type: 'string', example: 'ANDROID' },
          },
          deviceId: {
            in: 'header',
            name: 'deviceId',
            required: false,
            schema: { type: 'string', example: '89808098' },
          },
          version: { in: 'header', name: 'version', required: false, schema: { type: 'string', example: '1.0.5' } },
          location: { in: 'header', name: 'location', required: false, schema: { type: 'string', example: 'ASAWA' } },
          'X-Timezone': {
            in: 'header',
            name: 'X-Timezone',
            required: false,
            schema: { type: 'string', example: 'Asia/Kolkata' },
            description:
              'IANA timezone name for date/time fields (e.g., Asia/Kolkata, America/New_York, Europe/London)',
          },
        },
        headers: {
          latitude: { $ref: '#/components/parameters/latitude' },
          longitude: { $ref: '#/components/parameters/longitude' },
          deviceName: { $ref: '#/components/parameters/deviceName' },
          deviceType: { $ref: '#/components/parameters/deviceType' },
          deviceId: { $ref: '#/components/parameters/deviceId' },
          version: { $ref: '#/components/parameters/version' },
          location: { $ref: '#/components/parameters/location' },
        },
      },
      security: [{ bearerAuth: [] }],
      info: {
        title: 'User API',
        version: '1.0.0',
      },
    },
  )

  // Inject Lambda endpoints into Swagger spec from serverless.yml
  try {
    const serverlessPath = path.join(__dirname, '../../lambda-service/serverless.yml')
    if (fs.existsSync(serverlessPath)) {
      const slsContent = fs.readFileSync(serverlessPath, 'utf8')
      const slsConfig = yaml.load(slsContent) as any
      if (slsConfig?.functions) {
        if (!spec.paths) spec.paths = {}
        if (!spec.tags) spec.tags = []
        spec.tags.push({ name: 'Lambda', description: 'Lambda (Serverless) endpoints — runs on separate port' })

        for (const [name, fn] of Object.entries(slsConfig.functions as Record<string, any>)) {
          const events = (fn as any).events || []
          const handlerFile = path.join(__dirname, `../../lambda-service/src/handlers/${name}.ts`)
          const bodyParams = extractBodyParams(handlerFile)

          for (const event of events) {
            if (!event.http) continue
            const httpPath = `/${(event.http.path as string).replace(/^\//, '')}`
            const method = ((event.http.method as string) || 'post').toLowerCase()

            const properties: any = {}
            const required: string[] = []
            bodyParams.forEach(p => {
              properties[p.name] = {
                type: 'string',
                ...(p.hint ? { description: p.hint } : {}),
              }
              if (p.required) required.push(p.name)
            })

            if (!spec.paths[httpPath]) spec.paths[httpPath] = {}
            ;(spec.paths[httpPath] as any)[method] = {
              tags: ['Lambda'],
              summary: (fn as any).description || name,
              operationId: `lambda_${name}_${method}`,
              security: [],
              requestBody: Object.keys(properties).length
                ? {
                    required: true,
                    content: {
                      'application/json': {
                        schema: {
                          type: 'object',
                          properties,
                          ...(required.length ? { required } : {}),
                        },
                      },
                    },
                  }
                : undefined,
              responses: {
                '200': { description: 'Success' },
                '400': { description: 'Bad request' },
                '500': { description: 'Internal error' },
              },
            }
          }
        }
      }
    }
  } catch (err: any) {
    logger.warn('Failed to inject Lambda endpoints into Swagger spec', { error: err.message })
  }

  // Serve Swagger UI at /docs
  const swaggerCustomJs = `
    const origFetch = window.fetch;
    window.fetch = async function(...args) {
      const res = await origFetch.apply(this, args);
      try {
        const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
        if (url && url.includes('/api/auth/login') && res.ok) {
          const cloned = res.clone();
          const body = await cloned.json();
          if (body && body.token) {
            setTimeout(function() {
              if (window.ui) {
                window.ui.authActions.authorize({
                  bearerAuth: {
                    name: 'bearerAuth',
                    schema: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
                    value: body.token
                  }
                });
              }
            }, 300);
          }
        }
      } catch(e) {}
      return res;
    };
  `
  app.use(
    '/docs',
    swaggerUi.serve,
    swaggerUi.setup(spec, {
      swaggerOptions: { persistAuthorization: true },
      customJsStr: swaggerCustomJs,
    } as any),
  )
  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
  })

  // Serve the Next.js admin UI (static export) from the SAME origin as the API.
  // `next build` writes the site to UI/out; from dist/src that is ../../UI/out.
  // Because everything lives on one host:port, the UI's "/api/*" calls hit this
  // server directly — no CORS, no cross-port routing.
  const uiDir = path.join(__dirname, '../../UI/out')
  if (fs.existsSync(uiDir)) {
    // `extensions: ['html']` resolves "/users" -> "users.html", "/login" -> "login.html".
    // CSP violation reports are POSTed here (see helmetConfig.reportUri). Accept and
    // discard them with 204 so the browser doesn't log a 404 for every report.
    app.post('/report-violation', (_req, res) => res.sendStatus(204))

    app.use(express.static(uiDir, { extensions: ['html'], index: 'index.html' }))

    // SPA fallback: any GET that isn't an API/docs/health route and didn't match
    // a static file falls back to the UI shell so client-side routing works on
    // hard refresh / deep links.
    //
    // Next's static export writes one HTML file per route (e.g. "configuration.html"),
    // NOT "configuration/index.html". express.static resolves "/configuration" via
    // `extensions: ['html']`, but a trailing slash ("/configuration/") is treated as a
    // directory request and misses, so we must resolve the route-specific file here
    // before defaulting to index.html — otherwise a hard refresh on "/configuration/"
    // would serve the Home page bundle while the URL stays /configuration.
    app.get(/^\/(?!api\/|docs\b|health\b|report-violation\b).*/, (req, res, next) => {
      if (req.method !== 'GET') return next()

      // Normalise the requested path and map it to a candidate exported HTML file.
      const cleanPath = req.path.replace(/\/+$/, '') // strip trailing slash(es)
      if (cleanPath && cleanPath !== '/') {
        const candidates = [
          path.join(uiDir, `${cleanPath}.html`), // e.g. /configuration -> configuration.html
          path.join(uiDir, cleanPath, 'index.html'), // e.g. /configuration/ -> configuration/index.html
        ]
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

  const server = app.listen(envConfig.PORT, async () => {
    // Increased timeouts for long-running MCP operations
    server.keepAliveTimeout = 300000 // 5 minutes (300 seconds)
    server.headersTimeout = 310000 // Slightly more than keepAliveTimeout
    server.requestTimeout = 300000 // 5 minutes request timeout
    logger.info(`Server is running on port ${envConfig.PORT}`)

    // SOP auto-seed removed - SOP treatment types are now created via UI/API
  })

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    logger.info('SIGTERM signal received: closing HTTP server')
    server.close(async () => {
      logger.info('HTTP server closed')

      // Close MongoDB connection
      await mongoConnection.disconnect()
      logger.info('MongoDB connection closed')

      process.exit(0)
    })
  })

}

loadServer().catch(error => {
  logger.error('Error loading server: ', error)
  console.log('Error loading server:  ', error)
  process.exit(1)
})

// --- Auto-mounted ChatKit routes (added by ChatGPT) ---
