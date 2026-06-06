import { isNil } from 'lodash'
import { awsConfigurationKey } from '../../config'
import { EmailRequest, EmailWithAttachmentRequest } from '../../typings'
import { awsConfig } from './config.service'
import { LoggerProvider } from '../../provider'
const loggerProvider = LoggerProvider.Instance
export class EmailService {
  async sendEmail(emailRequest: EmailRequest) {
    try {
      const body = !isNil(emailRequest.html)
        ? {
            Html: {
              Charset: 'UTF-8',
              Data: emailRequest.html,
            },
          }
        : {
            Text: {
              Charset: 'UTF-8',
              Data: emailRequest.message,
            },
          }

      const params: any = {
        Destination: {
          CcAddresses: emailRequest.cc,
          ToAddresses: emailRequest.to,
        },
        Message: {
          Body: body,
          Subject: {
            Charset: 'UTF-8',
            Data: emailRequest.subject,
          },
        },
        Source: `Admin<${awsConfigurationKey.sesEmail.from}>` /* required */,
      }
      await new awsConfig.SES().sendEmail(params).promise()
    } catch (error: any) {
      loggerProvider.logger.error('sendEmail_Error', { error: error.message, stack: error.stack, emailRequest })
      throw error
    }
  }

  async sendRawEmail(emailRequest: EmailWithAttachmentRequest): Promise<void> {
    try {
      const boundary = `----=_Part_${Date.now()}`
      const fromAddress = `Admin<${awsConfigurationKey.sesEmail.from}>`

      let rawMessage = [
        `From: ${fromAddress}`,
        `To: ${emailRequest.email}`,
        `Subject: ${emailRequest.subject}`,
        `MIME-Version: 1.0`,
        `Content-Type: multipart/mixed; boundary="${boundary}"`,
        ``,
        `--${boundary}`,
        `Content-Type: text/html; charset=UTF-8`,
        `Content-Transfer-Encoding: 7bit`,
        ``,
        emailRequest.html,
      ].join('\r\n')

      for (const attachment of emailRequest.attachments) {
        const base64Content = Buffer.isBuffer(attachment.content)
          ? attachment.content.toString('base64')
          : Buffer.from(attachment.content).toString('base64')

        rawMessage += [
          ``,
          `--${boundary}`,
          `Content-Type: ${attachment.contentType}; name="${attachment.filename}"`,
          `Content-Disposition: attachment; filename="${attachment.filename}"`,
          `Content-Transfer-Encoding: base64`,
          ``,
          base64Content,
        ].join('\r\n')
      }

      rawMessage += `\r\n--${boundary}--`

      const params = {
        RawMessage: {
          Data: rawMessage,
        },
      }

      await new awsConfig.SES().sendRawEmail(params).promise()
    } catch (error: any) {
      loggerProvider.logger.error('sendRawEmail_Error', {
        error: error.message,
        stack: error.stack,
        email: emailRequest.email,
      })
      throw error
    }
  }
}
