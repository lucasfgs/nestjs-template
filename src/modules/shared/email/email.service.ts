import { Injectable, Logger } from '@nestjs/common';
import nodemailer, { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: Transporter;
  private from: string;
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
  }: {
    to: string;
    subject: string;
    from?: string;
    text: string;
  }): Promise<void> {
    try {
      await this.transporter.sendMail({
        to,
        subject,
        from: from || this.from,
        text,
      });
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}:`, error);
      throw error;
    }
  }
}
