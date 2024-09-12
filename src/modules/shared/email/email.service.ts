import { Injectable } from '@nestjs/common';
import nodemailer, { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: Transporter;
  private from: string;

  constructor() {
    const smtpTrasportOptions = String(process.env.SMTP_CONNECTION_STRING) || {
      host: String(process.env.SMTP_HOST),
      port: Number(process.env.SMTP_PORT),
      secure: Boolean(process.env.SMTP_SECURE),
      auth: {
        user: String(process.env.SMTP_USER),
        pass: String(process.env.SMTP_PASSWORD),
      },
    };

    this.from = process.env.SMTP_FROM || 'noreply@example.com';
    this.transporter = nodemailer.createTransport(smtpTrasportOptions);
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
    await this.transporter.sendMail({
      to,
      subject,
      from: from || this.from,
      text,
    });
  }
}
