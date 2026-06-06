import mongoose, { Connection } from 'mongoose'
import { LoggerProvider } from '../../provider'
import { configMongoDb } from '../../config'

const loggerProvider = LoggerProvider.Instance

export class MongoConnectionManager {
  private static instance: MongoConnectionManager
  private connection: Connection | null = null
  private isConnected: boolean = false

  private constructor() {}

  public static getInstance(): MongoConnectionManager {
    if (!MongoConnectionManager.instance) {
      MongoConnectionManager.instance = new MongoConnectionManager()
    }
    return MongoConnectionManager.instance
  }

  /**
   * Connect to MongoDB using URI from parameter or config
   */
  public async connect(uri?: string): Promise<Connection> {
    if (this.isConnected && this.connection) {
      return this.connection
    }

    const mongoUri = uri || configMongoDb.uri

    try {
      loggerProvider.logger.info(`Connecting to MongoDB: ${mongoUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`)

      await mongoose.connect(mongoUri, configMongoDb.options)

      this.connection = mongoose.connection
      this.isConnected = true

      this.connection.on('connected', () => {
        loggerProvider.logger.info('MongoDB connected successfully')
      })

      this.connection.on('error', (err) => {
        loggerProvider.logger.error('MongoDB connection error:', err)
      })

      this.connection.on('disconnected', () => {
        loggerProvider.logger.warn('MongoDB disconnected')
        this.isConnected = false
      })

      loggerProvider.logger.info('MongoDB connection established')
      return this.connection
    } catch (error) {
      loggerProvider.logger.error('Failed to connect to MongoDB:', error)
      throw error
    }
  }

  public getConnection(): Connection | null {
    return this.connection
  }

  public isConnectedStatus(): boolean {
    return this.isConnected
  }

  public async disconnect(): Promise<void> {
    if (this.connection) {
      await mongoose.disconnect()
      this.isConnected = false
      this.connection = null
      loggerProvider.logger.info('MongoDB disconnected')
    }
  }
}

export const mongoConnection = MongoConnectionManager.getInstance()
