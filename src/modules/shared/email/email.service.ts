import * as fs from 'fs';
import * as path from 'path';

import { Injectable, Logger } from '@nestjs/common';
import nodemailer, { Transporter } from 'nodemailer';

import { EmailTemplate } from './email-templates.enum';

@Injectable()
export class EmailService {
  private transporter: Transporter;
  private from: string;
  private theme: Record<string, unknown> | null = null;
  private readonly logger = new Logger(EmailService.name);

  constructor() {
    try {
      const smtpTrasportOptions = process.env.SMTP_CONNECTION_STRING || {
        host: process.env.SMTP_HOST || 'localhost',
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER || '',
          pass: process.env.SMTP_PASSWORD || '',
        },
      };

      this.from = process.env.SMTP_FROM || 'noreply@example.com';
      this.transporter = nodemailer.createTransport(smtpTrasportOptions);

      // Verify SMTP connection configuration
      this.transporter.verify((error) => {
        if (error) {
          this.logger.error('SMTP configuration error:', error);
        } else {
          this.logger.log('SMTP server connection established successfully');
        }
      });
    } catch (error) {
      this.logger.error('Failed to initialize email service:', error);
      // Create a dummy transporter that will log instead of sending
      this.transporter = {
        sendMail: async (options) => {
          this.logger.warn(
            'Email service not properly configured. Would have sent:',
            options,
          );
          return Promise.resolve();
        },
      } as Transporter;
    }
  }

  async sendEmail({
    to,
    subject,
    from,
    text,
    html,
    template,
    templateData,
  }: {
    to: string | string[];
    subject: string;
    from?: string;
    text?: string;
    html?: string;
    template?: EmailTemplate | string;
    templateData?: Record<string, unknown>;
  }): Promise<void> {
    try {
      // If not in production, force all outgoing email recipients to the
      // DEVELOPMENT_EMAIL_SEND_TO address to prevent accidental sends.
      // Skip enforcement during test runs so unit tests can run locally
      if (
        process.env.NODE_ENV !== 'production' &&
        process.env.NODE_ENV !== 'test'
      ) {
        const devRecipient = process.env.DEVELOPMENT_EMAIL_SEND_TO;
        if (!devRecipient) {
          throw new Error(
            'DEVELOPMENT_EMAIL_SEND_TO must be set when NODE_ENV is not production',
          );
        }
        // Log the original intended recipients for debugging
        const originalRecipients = Array.isArray(to) ? to.join(', ') : to;
        this.logger.debug(
          `DEV MODE: Redirecting email from [${originalRecipients}] to [${devRecipient}]`,
        );
        // Override recipient(s) with the development address
        to = devRecipient;
      }
      let renderedHtml: string | undefined = html;
      if (template) {
        try {
          // lazy-load theme.json from templates folder
          if (!this.theme) {
            try {
              const themeCandidates = [
                path.join(
                  process.cwd(),
                  'dist',
                  'modules',
                  'shared',
                  'email',
                  'templates',
                  'theme.json',
                ),
                path.join(__dirname, 'templates', 'theme.json'),
                path.join(
                  process.cwd(),
                  'src',
                  'modules',
                  'shared',
                  'email',
                  'templates',
                  'theme.json',
                ),
              ];
              for (const t of themeCandidates) {
                if (fs.existsSync(t)) {
                  const themeFile = fs.readFileSync(t, 'utf8');
                  this.theme = JSON.parse(themeFile);
                  break;
                }
              }
            } catch (e) {
              this.logger.warn(
                'Could not load email theme.json, using defaults',
              );
              this.theme = null;
            }
          }

          // merge theme into templateData (templateData takes precedence)
          const mergedData = Object.assign(
            {},
            this.theme || {},
            templateData || {},
          );
          // Try compiled templates first (e.g. dist), then fall back to source templates
          const candidatePaths = [
            // Prefer templates copied into the compiled `dist` folder
            path.join(
              process.cwd(),
              'dist',
              'modules',
              'shared',
              'email',
              'templates',
              `${template}.hbs`,
            ),
            // Fallback to compiled module location (when running from source or some build setups)
            path.join(__dirname, 'templates', `${template}.hbs`),
            // Source path (useful for local dev when running ts-node or tests)
            path.join(
              process.cwd(),
              'src',
              'modules',
              'shared',
              'email',
              'templates',
              `${template}.hbs`,
            ),
          ];

          let file: string | null = null;
          for (const p of candidatePaths) {
            if (fs.existsSync(p)) {
              file = fs.readFileSync(p, 'utf8');
              break;
            }
          }

          if (!file) {
            const tried = candidatePaths.join(', ');
            const msg = `Email template not found: ${template}. Checked paths: ${tried}`;
            this.logger.error(msg);
            throw new Error(msg);
          }
          // Dynamically require handlebars so tests can mock it if needed
          // and so the package isn't strictly required at module import time.
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const Handlebars = require('handlebars');
          const compiled = Handlebars.compile(file);
          renderedHtml = compiled(mergedData);
        } catch (err) {
          this.logger.error(
            `Failed to render email template ${template}:`,
            err,
          );
          throw err;
        }
      }
      await this.transporter.sendMail({
        to,
        subject,
        from: from || this.from,
        text,
        html: renderedHtml,
      });
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}:`, error);
      throw error;
    }
  }

  /**
   * Render a template to HTML without sending an email. Throws if template not found.
   */
  async renderTemplate(
    template: EmailTemplate | string,
    templateData?: Record<string, unknown>,
  ): Promise<string> {
    // lazy-load theme.json from templates folder
    if (!this.theme) {
      try {
        const themePath = path.join(__dirname, 'templates', 'theme.json');
        if (fs.existsSync(themePath)) {
          const themeFile = fs.readFileSync(themePath, 'utf8');
          this.theme = JSON.parse(themeFile);
        }
      } catch (e) {
        this.logger.warn('Could not load email theme.json, using defaults');
        this.theme = null;
      }
    }

    const mergedData = Object.assign({}, this.theme || {}, templateData || {});

    const candidatePaths = [
      path.join(
        process.cwd(),
        'dist',
        'modules',
        'shared',
        'email',
        'templates',
        `${template}.hbs`,
      ),
      path.join(__dirname, 'templates', `${template}.hbs`),
      path.join(
        process.cwd(),
        'src',
        'modules',
        'shared',
        'email',
        'templates',
        `${template}.hbs`,
      ),
    ];

    let file: string | null = null;
    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        file = fs.readFileSync(p, 'utf8');
        break;
      }
    }

    if (!file) {
      const tried = candidatePaths.join(', ');
      const msg = `Email template not found: ${template}. Checked paths: ${tried}`;
      this.logger.error(msg);
      throw new Error(msg);
    }

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Handlebars = require('handlebars');
    const compiled = Handlebars.compile(file);
    return compiled(mergedData);
  }
}
