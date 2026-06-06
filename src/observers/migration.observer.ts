import { registry } from 'dependencyjs'
// import mongoose from 'mongoose'
import {
    AgentJWTAuthenticationStrategy,
  AuthenticationStrategy,
  BasicAuthenticationStrategy,
  EmailAuthenticationStrategy,
  JWTAuthenticationStrategy,
  MetaWebhookStrategy,
  StripeWebhookStrategy,
  OtpAuthenticationStrategy
} from '../strategies'
import { AuthenticationStrategyType } from '../typings'
import { LoggerProvider } from '../provider/logger.provider'
import {SeederService} from '../service'

const loggerProvider = LoggerProvider.Instance

export class MigrationObserver {
  private static instance: MigrationObserver

  async start(): Promise<void> {
    this.registerAuthenticationStrategy()
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    await this.migrateSchema()
  }

  async migrateSchema(): Promise<void> {
    console.log('Migration start.')
    // Wait for all MongoDB indexes to be created before inserting seed data
    // This prevents TransientTransactionError (WriteConflict) caused by
    // concurrent index creation (catalog changes) during transactions
    loggerProvider.logger.info('Waiting for MongoDB indexes to be created...')
    //await mongoose.connection.syncIndexes()
    loggerProvider.logger.info('MongoDB indexes ready.')
    await SeederService.Instance.saveSeedData()
    console.log('Migration complete.')
  }
  static getInstance(): MigrationObserver {
    if (!MigrationObserver.instance) {
      MigrationObserver.instance = new MigrationObserver()
    }
    return MigrationObserver.instance
  }

  registerAuthenticationStrategy() {
    registry.register(AuthenticationStrategy, new OtpAuthenticationStrategy(), AuthenticationStrategyType.OTP_AUTH)
    registry.register(AuthenticationStrategy, new JWTAuthenticationStrategy(), AuthenticationStrategyType.JWT_AUTH)
    registry.register(AuthenticationStrategy, new BasicAuthenticationStrategy(), AuthenticationStrategyType.BASIC_AUTH)
    registry.register(AuthenticationStrategy, new EmailAuthenticationStrategy(), AuthenticationStrategyType.EMAIL_AUTH)
    registry.register(AuthenticationStrategy, new MetaWebhookStrategy(), AuthenticationStrategyType.FACEBOOK_AUTH)
    registry.register(AuthenticationStrategy, new StripeWebhookStrategy(), AuthenticationStrategyType.STRIPE_WEBHOOK)
    registry.register(
      AuthenticationStrategy,
      new AgentJWTAuthenticationStrategy(),
      AuthenticationStrategyType.JWT_AGENT_AUTH,
    )
  }
}
