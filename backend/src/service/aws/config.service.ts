import AWS from 'aws-sdk'
import { awsConfigurationKey } from '../../config'
import { S3Client } from '@aws-sdk/client-s3'
import { LoggerProvider } from '../../provider'

const loggerProvider = LoggerProvider.Instance

AWS.config = new AWS.Config(awsConfigurationKey.config)
class AwsConfigService {
  public static get awsConfig() {
    try {
      return AWS
    } catch (error: any) {
      loggerProvider.logger.error('awsConfig_Error', { error: error.message, stack: error.stack })
      throw error
    }
  }
}

export const awsConfig = AwsConfigService.awsConfig

export const s3Client = new S3Client({
  region: awsConfigurationKey.config.region,
  credentials: {
    accessKeyId: awsConfigurationKey.config.accessKeyId,
    secretAccessKey: awsConfigurationKey.config.secretAccessKey,
  },
})
