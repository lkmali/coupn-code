import 'reflect-metadata'
import app, { logger } from './app'
import { envConfig } from './config'
import { mongoConnection } from './database/connection/mongoConnection'

// Long-running entry point (local dev, Docker, any always-on host). The Vercel
// deployment never runs this file — it imports the app from ./app directly via
// api/index.js, because a serverless function is handed a request rather than a
// port to listen on.
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
