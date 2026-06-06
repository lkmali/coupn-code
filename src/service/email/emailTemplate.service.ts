/* eslint-disable max-len */
import { isNil } from 'lodash'
import { envConfig } from '../../config'
import {
  CreateEmailTemplateRequest,
  EmailTemplateRequest,
  SharedResourceEmailTemplateRequest,
  DynamicEmailTemplateRequest,
  TemplateName,
} from '../../typings'
import { badRequest } from '../../utils'
import { EncryptionService } from '../encryption.service'
import { LoggerProvider } from '../../provider'
const loggerProvider = LoggerProvider.Instance

export class EmailTemplateService {
  private static instance: EmailTemplateService

  // ─── Common Styles ───────────────────────────────────────────────────
  private getCommonStyles(extraStyles?: string): string {
    return `
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background-color: #f5f5f5;
            color: #333;
            line-height: 1.6;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
        }
        .logo-section {
            text-align: center;
            padding: 20px 20px;
        }
        .logo-section img {
            height: 50px;
            width: auto;
        }
        .header-banner {
            margin: 0 20px;
            border-radius: 12px;
            overflow: hidden;
        }
        .header-banner img {
            width: 100%;
            height: auto;
            display: block;
        }
        .content-section {
            padding: 30px 40px 20px;
        }
        .greeting {
            font-size: 28px;
            font-weight: 500;
            color: #1a1a2e;
            margin-bottom: 18px;
        }
        .regards {
            font-size: 16px;
            color: #333;
            margin-bottom: 5px;
        }
        .team-name {
            font-size: 16px;
            color: #2563eb;
            font-weight: 500;
        }
        .divider {
            border: none;
            border-top: 1px solid #e5e5e5;
            margin: 20px 40px;
        }
        .social-section {
            text-align: center;
            padding: 15px 40px;
        }
        .social-icons {
            display: flex;
            justify-content: center;
            gap: 15px;
        }
        .social-icon {
            width: 44px;
            height: 44px;
            display: flex;
            align-items: center;
            justify-content: center;
            text-decoration: none;
        }
        .social-icon img {
            width: 44px;
            height: 44px;
        }
        .footer-divider {
            border: none;
            border-top: 1px solid #e5e5e5;
            margin: 15px 40px;
        }
        .copyright {
            text-align: center;
            font-size: 14px;
            color: #666;
            padding: 15px 40px 8px;
        }
        .company-info {
            text-align: center;
            padding: 8px 40px 15px;
        }
        .company-name {
            font-size: 14px;
            font-weight: bold;
            color: #1a1a2e;
            margin-bottom: 5px;
        }
        .company-address {
            font-size: 13px;
            color: #666;
        }
        .bottom-divider {
            border: none;
            border-top: 1px solid #e5e5e5;
            margin: 8px 40px 12px;
        }
        .disclaimer {
            text-align: center;
            font-size: 13px;
            color: #888;
            padding: 8px 40px 10px;
            line-height: 1.5;
        }
        .footer-links {
            text-align: center;
            padding: 8px 40px 20px;
        }
        .footer-links a {
            color: #666;
            text-decoration: underline;
            font-size: 13px;
            margin: 0 5px;
        }
        .footer-links span {
            color: #2563eb;
            font-size: 8px;
        }

        /* Tablet - 768px and below */
        @media screen and (max-width: 768px) {
            .email-container {
                max-width: 100%;
            }
            .content-section {
                padding: 25px 30px 18px;
            }
            .greeting {
                font-size: 26px;
            }
            .divider,
            .footer-divider,
            .bottom-divider {
                margin-left: 30px;
                margin-right: 30px;
            }
            .social-section,
            .copyright,
            .company-info,
            .disclaimer,
            .footer-links {
                padding-left: 30px;
                padding-right: 30px;
            }
        }

        /* Mobile - 480px and below */
        @media screen and (max-width: 480px) {
            .logo-section {
                padding: 15px 15px;
            }
            .logo-section img {
                height: 40px;
            }
            .header-banner {
                margin: 0 15px;
                border-radius: 8px;
            }
            .content-section {
                padding: 20px 20px 15px;
            }
            .greeting {
                font-size: 24px;
                margin-bottom: 15px;
            }
            .regards,
            .team-name {
                font-size: 14px;
            }
            .divider,
            .footer-divider,
            .bottom-divider {
                margin-left: 20px;
                margin-right: 20px;
            }
            .social-section {
                padding: 12px 20px;
            }
            .social-icon,
            .social-icon img {
                width: 38px;
                height: 38px;
            }
            .copyright {
                font-size: 12px;
                padding: 12px 20px 6px;
            }
            .company-info {
                padding: 6px 20px 12px;
            }
            .company-name {
                font-size: 12px;
            }
            .company-address {
                font-size: 11px;
            }
            .disclaimer {
                font-size: 11px;
                padding: 6px 20px 8px;
            }
            .footer-links {
                padding: 6px 20px 15px;
            }
            .footer-links a {
                font-size: 11px;
            }
        }

        /* Small Mobile - 360px and below */
        @media screen and (max-width: 360px) {
            .greeting {
                font-size: 22px;
            }
            .social-icons {
                gap: 10px;
            }
            .social-icon,
            .social-icon img {
                width: 34px;
                height: 34px;
            }
        }

        ${extraStyles || ''}`
  }

  // ─── Common Header (Logo + Banner) ───────────────────────────────────
  private getCommonHeader(): string {
    return `
        <!-- Logo -->
        <div class="logo-section">
            <img src="https://www.aiplustechnology.com/publicImage/logo3.png" alt="Logo">
        </div>

        <!-- Header Banner -->
        <div class="header-banner">
            <img src="https://www.aiplustechnology.com/publicImage/image@3x.png" alt="AI+">
        </div>`
  }

  // ─── Common Footer (Social + Copyright + Company + Disclaimer + Links) ─
  private getCommonFooter(): string {
    return `
        <hr class="divider">

        <!-- Social Icons -->
        <div class="social-section">
            <div class="social-icons">
                <a href="https://www.linkedin.com/company/anantkaya/posts/?feedView=all" target="_blank" class="social-icon">
                    <img src="https://www.aiplustechnology.com/publicImage/group-209@3x.png" alt="LinkedIn">
                </a>
                <a href="https://www.instagram.com/anantkaya.solutions/" target="_blank" class="social-icon">
                    <img src="https://www.aiplustechnology.com/publicImage/group-207@3x.png" alt="Instagram">
                </a>
                <a href="https://www.facebook.com/people/AnantKaya/61579649911268/#" target="_blank" class="social-icon">
                    <img src="https://www.aiplustechnology.com/publicImage/group-208@3x.png" alt="Facebook">
                </a>
            </div>
        </div>

        <hr class="footer-divider">

        <!-- Copyright -->
        <p class="copyright">&copy; ${new Date().getFullYear()} AI+ Technology. All rights reserved.</p>

        <!-- Company Info -->
        <div class="company-info">
            <p class="company-name">AI+ Technology Private Limited,</p>
            <p class="company-address">26th Floor, GIFT One Tower, Gift City<br>
                                Gandhi Nagar, Gujarat, India, 382050<br>
                                <strong style="color: #ffffff;">+91 9227980884</strong><br>
                                <a href="mailto:contact@anantkaya.com" style="color: #a0aec0; text-decoration: underline;">contact@anantkaya.com</a></p>
        </div>

        <hr class="bottom-divider">

        <!-- Disclaimer -->
        <p class="disclaimer">
            You are receiving this email because you have an account with AI+.<br>
            This is an automated message, please do not reply to this email.
        </p>

        <!-- Footer Links -->
        <div class="footer-links">
            <a href="https://anantkaya.com/privacy-policy.html" target="_blank">Privacy policy</a>
            <span>&#9679;</span>
            <a href="https://anantkaya.com/term-condition.html" target="_blank">Terms of service</a>
            <span>&#9679;</span>
            <a href="mailto:contact@anantkaya.com">Help center</a>
        </div>`
  }

  // ─── Wrap Content with Full Email Layout ─────────────────────────────
  private wrapWithEmailLayout(options: { title: string; content: string; extraStyles?: string }): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${options.title}</title>
    <style>${this.getCommonStyles(options.extraStyles)}</style>
</head>
<body>
    <div class="email-container">
        ${this.getCommonHeader()}

        <!-- Main Content -->
        <div class="content-section">
            ${options.content}
        </div>

        ${this.getCommonFooter()}
    </div>
</body>
</html>`
  }

  // ─── Old header/footer for sharedResource & dynamicTemplate (gradient table-based) ─
  private getEmailHeader(): string {
    try {
      return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI+ Email</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f7fa; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f4f7fa;">
        <tr>
            <td style="padding: 40px 20px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); overflow: hidden;">

                    <!-- Header Section with Gradient -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                            <img src="https://platform.aiplustechnology.com/https://www.aiplustechnology.com/publicImage/logo-img-Bl68VJq2.avif"
                                 alt="AI+ Logo"
                                 width="120"
                                 style="display: block; margin: 0 auto 15px; max-width: 120px; height: auto;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600; letter-spacing: -0.5px;">AI+ Technology</h1>
                            <p style="margin: 8px 0 0 0; color: #e8e8ff; font-size: 14px; font-weight: 400;">Innovative Solutions for Tomorrow</p>
                        </td>
                    </tr>

                    <!-- Main Content Section -->
                    <tr>
                        <td style="padding: 40px 35px; background-color: #ffffff;">`
    } catch (error: any) {
      loggerProvider.logger.error('getEmailHeader_Error', { error: error.message, stack: error.stack })
      throw error
    }
  }

  private getEmailFooter(): string {
    try {
      return `
                            <!-- Signature Section -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 30px; padding-top: 25px; border-top: 2px solid #e8ecf1;">
                                <tr>
                                    <td>
                                        <p style="margin: 0 0 5px 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 15px; color: #333333; font-weight: 600;">Best regards,</p>
                                        <p style="margin: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 15px; color: #667eea; font-weight: 600;">The AI+ Team</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Footer Section -->
                    <tr>
                        <td style="background-color: #2d3748; padding: 35px 30px; text-align: center;">
                            <!-- Social Links -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 20px;">
                                <tr>
                                    <td align="center">
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="display: inline-block;">
                                            <tr>
                                                <td style="padding: 0 10px;">
                                                    <a href="https://platform.aiplustechnology.com" style="color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 500;">Website</a>
                                                </td>
                                                <td style="padding: 0 10px; color: #718096;">|</td>
                                                <td style="padding: 0 10px;">
                                                    <a href="mailto:support@aiplustechnology.com" style="color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 500;">Support</a>
                                                </td>
                                                <td style="padding: 0 10px; color: #718096;">|</td>
                                                <td style="padding: 0 10px;">
                                                    <a href="https://platform.aiplustechnology.com/contact" style="color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 500;">Contact</a>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <!-- Company Info -->
                            <p style="margin: 0 0 12px 0; color: #a0aec0; font-size: 13px; line-height: 1.6;">
                                <strong style="color: #ffffff;">AI+ Technology Private Limited</strong><br>
                                Plot No. D-5, 91 Springboard Business Hub<br>
                                Road No. 20, Marol MIDC, Andheri East<br>
                                Mumbai, Maharashtra 400093, India
                            </p>

                            <!-- Divider -->
                            <div style="height: 1px; background-color: #4a5568; margin: 20px 0;"></div>

                            <!-- Copyright -->
                            <p style="margin: 0; color: #718096; font-size: 12px;">
                                © ${new Date().getFullYear()} AI+ Technology. All rights reserved.
                            </p>

                            <!-- Disclaimer -->
                            <p style="margin: 10px 0 0 0; color: #718096; font-size: 11px; line-height: 1.5;">
                                You are receiving this email because you have an account with AI+.<br>
                                This is an automated message, please do not reply to this email.
                            </p>
                        </td>
                    </tr>

                </table>

                <!-- Email Client Spacer -->
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 20px auto 0;">
                    <tr>
                        <td style="text-align: center; padding: 10px;">
                            <p style="margin: 0; color: #a0aec0; font-size: 11px;">
                                Having trouble viewing this email? <a href="#" style="color: #667eea; text-decoration: none;">View in browser</a>
                            </p>
                        </td>
                    </tr>
                </table>

            </td>
        </tr>
    </table>
</body>
</html>`
    } catch (error: any) {
      loggerProvider.logger.error('getEmailFooter_Error', { error: error.message, stack: error.stack })
      throw error
    }
  }

  // ─── Template Router ─────────────────────────────────────────────────
  getTemplateRequest(type: TemplateName): Function {
    try {
      switch (type) {
        case 'SET_PASSWORD': {
          return (data: CreateEmailTemplateRequest): EmailTemplateRequest => this.setPasswordTemplate(data)
        }
        case 'RESET_PASSWORD': {
          return (data: CreateEmailTemplateRequest): EmailTemplateRequest => this.resetPasswordTemplate(data)
        }
        case 'SHARED_RESOURCE': {
          return (data: SharedResourceEmailTemplateRequest): EmailTemplateRequest => this.sharedResourceTemplate(data)
        }
        case 'WELCOME_EMAIL':

        case 'CUSTOM_EMAIL': {
          return (data: DynamicEmailTemplateRequest): EmailTemplateRequest => this.dynamicTemplate(data)
        }
        default: {
          throw badRequest('invalid type')
        }
      }
    } catch (error: any) {
      loggerProvider.logger.error('getTemplateRequest_Error', { error: error.message, stack: error.stack, type })
      throw error
    }
  }

  // ─── Password Templates ──────────────────────────────────────────────
  private getPasswordStyles(): string {
    return `
        .welcome-text {
            font-size: 16px;
            color: #333;
            margin-bottom: 8px;
        }
        .welcome-text strong {
            color: #1a1a2e;
        }
        .email-highlight {
            color: rgba(26, 42, 177);
            text-decoration: none;
            font-weight: 600;
        }
        .invite-text {
            font-size: 16px;
            color: #333;
            margin-top: 15px;
            margin-bottom: 22px;
        }
        .invite-text strong {
            color: #1a1a2e;
        }
        .btn-password {
            display: inline-block;
            background-color: rgba(26, 42, 177);
            color: #ffffff;
            text-decoration: none;
            padding: 12px 70px;
            border-radius: 50px;
            font-size: 16px;
            font-weight: 500;
            margin-bottom: 22px;
        }
        .security-notice {
            font-size: 15px;
            font-weight: normal;
            color: #333;
            margin-bottom: 15px;
        }
        .security-notice strong {
            color: #1a1a2e;
        }
        .ignore-text {
            font-size: 15px;
            color: #666;
            margin-bottom: 22px;
        }

        @media screen and (max-width: 480px) {
            .welcome-text,
            .invite-text {
                font-size: 14px;
            }
            .btn-password {
                padding: 10px 50px;
                font-size: 14px;
            }
            .security-notice {
                font-size: 13px;
            }
            .ignore-text {
                font-size: 13px;
            }
        }

        @media screen and (max-width: 360px) {
            .btn-password {
                padding: 10px 40px;
            }
        }`
  }

  setPasswordTemplate({ username, otp, email }: CreateEmailTemplateRequest): EmailTemplateRequest {
    try {
      const data = EncryptionService.Instance.encrypt(otp)
      const link = `${envConfig.SERVER_UI_URL}/account/set-password?token=${data}&email=${encodeURIComponent(email)}`

      const content = `
            <h2 class="greeting">Hi ${username},</h2>

            <p class="welcome-text">
                Welcome to <strong>AI+</strong>
            </p>

            <p class="invite-text">
                You've been invited to access the <strong>AI+ Technology Platform.</strong><br>
                To get started, please set up your account by creating a password.
            </p>

            <a href="${link}" class="btn-password">Create Password</a>

            <p class="security-notice">For security reasons, this link will expire in <strong>24 hours.</strong></p>

            <p class="ignore-text">If you didn't expect this invitation, you can safely ignore this email.</p>

            <p class="regards">Warm regards,</p>
            <p class="team-name">The AI+ Team</p>`

      return {
        email,
        html: this.wrapWithEmailLayout({
          title: 'Welcome to AI+',
          content,
          extraStyles: this.getPasswordStyles(),
        }),
        subject: 'Welcome to AI+ - Set Your Password',
      }
    } catch (error: any) {
      loggerProvider.logger.error('setPasswordTemplate_Error', { error: error.message, stack: error.stack, email })
      throw error
    }
  }

  resetPasswordTemplate({ otp, email, username }: CreateEmailTemplateRequest): EmailTemplateRequest {
    try {
      const data = EncryptionService.Instance.encrypt(otp)
      const link = `${envConfig.SERVER_UI_URL}/account/set-password?token=${data}&email=${encodeURIComponent(email)}`

      const content = `
            <h2 class="greeting">Hi ${username},</h2>

            <p class="welcome-text">
                We received a request to reset your <strong>AI+ account password.</strong>
            </p>

            <p class="invite-text">
                Click the button below to create a new password and regain access to your account.
            </p>

            <a href="${link}" class="btn-password">Reset Password</a>

            <p class="security-notice">For your security, this link will expire in <strong>24 hours.</strong></p>

            <p class="ignore-text">If you didn't request a password reset, you can safely ignore this email your account will remain secure.</p>

            <p class="regards">Warm regards,</p>
            <p class="team-name">The AI+ Team</p>`

      return {
        email,
        html: this.wrapWithEmailLayout({
          title: 'Reset Password - AI+',
          content,
          extraStyles: this.getPasswordStyles(),
        }),
        subject: 'Reset your AI+ password',
      }
    } catch (error: any) {
      loggerProvider.logger.error('resetPasswordTemplate_Error', { error: error.message, stack: error.stack, email })
      throw error
    }
  }

  // ─── Shared Resource Template ────────────────────────────────────────
  sharedResourceTemplate({
    otp,
    email,
    adminEmail,
    resource,
  }: SharedResourceEmailTemplateRequest): EmailTemplateRequest {
    try {
      const link = `${envConfig.SERVER_UI_URL}/share-login/${otp}`

      const content = `
      <h2 style="margin: 0 0 20px 0; color: #667eea; font-size: 24px; font-weight: 600; text-align: center;">Shared Resource</h2>

      <p style="margin: 0 0 15px 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 15px; line-height: 1.6; color: #333333;">
        Hello,
      </p>

      <p style="margin: 0 0 15px 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 15px; line-height: 1.6; color: #333333;">
        <strong>${adminEmail}</strong> has shared <strong>${resource}</strong> with you on the AI+ platform.
      </p>

      <p style="margin: 0 0 25px 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 15px; line-height: 1.6; color: #333333;">
        Click the button below to access your shared content:
      </p>

      <!-- Button -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 30px 0;">
        <tr>
          <td align="center">
            <a href="${link}"
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                      color: #ffffff;
                      text-decoration: none;
                      padding: 14px 40px;
                      border-radius: 8px;
                      font-weight: 600;
                      font-size: 16px;
                      display: inline-block;
                      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
              View Shared Resource
            </a>
          </td>
        </tr>
      </table>

      <p style="margin: 25px 0 0 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 14px; line-height: 1.6; color: #666666;">
        This link provides secure access to the shared content. Keep it confidential.
      </p>

      <p style="margin: 15px 0 0 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 14px; line-height: 1.6; color: #999999; font-style: italic;">
        If you have any questions about this shared resource, please contact ${adminEmail}.
      </p>
    `

      return {
        email,
        html: this.getEmailHeader() + content + this.getEmailFooter(),
        subject: `Shared ${resource} - AI+`,
      }
    } catch (error: any) {
      loggerProvider.logger.error('sharedResourceTemplate_Error', {
        error: error.message,
        stack: error.stack,
        email,
        resource,
      })
      throw error
    }
  }

  // ─── Dynamic Template ────────────────────────────────────────────────
  dynamicTemplate({ email, subject, body }: DynamicEmailTemplateRequest): EmailTemplateRequest {
    try {
      // Check if body contains HTML tags
      const isHtml = /<[a-z][\s\S]*>/i.test(body)

      return {
        email,
        subject,
        html: isHtml ? body : this.wrapPlainTextInHtml(body),
      }
    } catch (error: any) {
      loggerProvider.logger.error('dynamicTemplate_Error', { error: error.message, stack: error.stack, email, subject })
      throw error
    }
  }

  private wrapPlainTextInHtml(text: string): string {
    try {
      // Convert plain text to HTML with proper formatting
      const paragraphs = text
        .split('\n\n')
        .map(para => {
          const lines = para.split('\n').join('<br>')
          return `<p style="margin:0 0 15px 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 15px; line-height: 1.6; color: #333333;">${lines}</p>`
        })
        .join('')

      const content = `
                            ${paragraphs}

                            <!-- Signature Section -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 30px; padding-top: 25px; border-top: 2px solid #e8ecf1;">
                                <tr>
                                    <td>
                                        <p style="margin: 0 0 5px 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 15px; color: #333333; font-weight: 600;">Best regards,</p>
                                        <p style="margin: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 15px; color: #667eea; font-weight: 600;">The AI+ Team</p>
                                    </td>
                                </tr>
                            </table>`

      return this.getEmailHeader() + content + this.getEmailFooter()
    } catch (error: any) {
      loggerProvider.logger.error('wrapPlainTextInHtml_Error', { error: error.message, stack: error.stack })
      throw error
    }
  }
  public static get Instance() {
    try {
      if (isNil(this.instance)) this.instance = new this()

      return this.instance
    } catch (error: any) {
      loggerProvider.logger.error('Instance_Error', { error: error.message, stack: error.stack })
      throw error
    }
  }
}
