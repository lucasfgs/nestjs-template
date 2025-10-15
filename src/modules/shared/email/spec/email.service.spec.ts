jest.mock('nodemailer', () => {
  const createTransport = jest.fn();
  return {
    createTransport,
    default: { createTransport },
  };
});

import * as fs from 'fs';
import * as path from 'path';

import * as Handlebars from 'handlebars';
import nodemailer from 'nodemailer';

import { EmailService } from '../email.service';

describe('EmailService', () => {
  let service: EmailService;
  let mockTransporter: any;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    mockTransporter = {
      verify: jest.fn(),
      sendMail: jest.fn(),
    };
    (nodemailer.createTransport as jest.Mock).mockReturnValue(mockTransporter);
    delete process.env.SMTP_FROM;
    service = new EmailService();
  });

  afterEach(() => {
    jest.clearAllMocks();
    process.env = originalEnv;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should initialize with default configuration', () => {
    expect(nodemailer.createTransport).toHaveBeenCalledWith({
      host: 'localhost',
      port: 587,
      secure: false,
      auth: {
        user: '',
        pass: '',
      },
    });
  });

  it('should initialize with custom configuration', () => {
    process.env.SMTP_HOST = 'smtp.example.com';
    process.env.SMTP_PORT = '465';
    process.env.SMTP_SECURE = 'true';
    process.env.SMTP_USER = 'user';
    process.env.SMTP_PASSWORD = 'pass';
    process.env.SMTP_FROM = 'test@example.com';
    new EmailService();
    expect(nodemailer.createTransport).toHaveBeenCalledWith({
      host: 'smtp.example.com',
      port: 465,
      secure: true,
      auth: {
        user: 'user',
        pass: 'pass',
      },
    });
  });

  it('should initialize with SMTP connection string', () => {
    process.env.SMTP_CONNECTION_STRING = 'smtp://user:pass@localhost:587';
    new EmailService();
    expect(nodemailer.createTransport).toHaveBeenCalledWith(
      'smtp://user:pass@localhost:587',
    );
  });

  it('should handle SMTP connection error', () => {
    mockTransporter.verify.mockImplementation((callback) => {
      callback(new Error('Connection failed'));
    });
    new EmailService();
    expect(nodemailer.createTransport).toHaveBeenCalled();
  });

  it('should handle successful SMTP verification', () => {
    mockTransporter.verify.mockImplementation((callback) => {
      callback(null);
    });
    new EmailService();
    expect(nodemailer.createTransport).toHaveBeenCalled();
  });

  it('should handle initialization error and create dummy transporter', () => {
    (nodemailer.createTransport as jest.Mock).mockImplementation(() => {
      throw new Error('Failed to create transport');
    });
    const errorService = new EmailService();
    expect(errorService).toBeDefined();
  });

  it('should send email successfully', async () => {
    mockTransporter.sendMail.mockResolvedValueOnce({ messageId: '123' });
    // Test with default from
    await service.sendEmail({
      to: 'test@example.com',
      subject: 'Test Subject',
      text: 'Test Content',
    });
    expect(mockTransporter.sendMail).toHaveBeenCalledWith({
      to: 'test@example.com',
      subject: 'Test Subject',
      from: 'noreply@example.com',
      text: 'Test Content',
    });
    // Test with custom from
    process.env.SMTP_FROM = 'test@example.com';
    service = new EmailService();
    await service.sendEmail({
      to: 'test@example.com',
      subject: 'Test Subject',
      text: 'Test Content',
    });
    expect(mockTransporter.sendMail).toHaveBeenCalledWith({
      to: 'test@example.com',
      subject: 'Test Subject',
      from: 'test@example.com',
      text: 'Test Content',
    });
  });

  it('should handle email sending error', async () => {
    const error = new Error('Failed to send email');
    mockTransporter.sendMail.mockRejectedValueOnce(error);
    await expect(
      service.sendEmail({
        to: 'test@example.com',
        subject: 'Test Subject',
        text: 'Test Content',
      }),
    ).rejects.toThrow(error);
  });

  it('should use custom from address when provided', async () => {
    mockTransporter.sendMail.mockResolvedValueOnce({ messageId: '123' });
    await service.sendEmail({
      to: 'test@example.com',
      subject: 'Test Subject',
      text: 'Test Content',
      from: 'custom@example.com',
    });
    expect(mockTransporter.sendMail).toHaveBeenCalledWith({
      to: 'test@example.com',
      subject: 'Test Subject',
      from: 'custom@example.com',
      text: 'Test Content',
    });
  });

  it('should render template and send html', async () => {
    // Prepare a fake template file and mock handlebars
    const templateDir = path.join(__dirname, '..', 'templates');
    const templatePath = path.join(templateDir, 'test-template.hbs');
    // Ensure templates directory exists
    if (!fs.existsSync(templateDir)) {
      fs.mkdirSync(templateDir);
    }
    fs.writeFileSync(templatePath, '<p>Hello {{name}}</p>');

    jest.spyOn(Handlebars, 'compile');

    mockTransporter.sendMail.mockResolvedValueOnce({ messageId: '123' });
    await service.sendEmail({
      to: 'test@example.com',
      subject: 'Template Subject',
      template: 'test-template',
      templateData: { name: 'Tester' },
    });

    expect(mockTransporter.sendMail).toHaveBeenCalledWith({
      to: 'test@example.com',
      subject: 'Template Subject',
      from: 'noreply@example.com',
      text: undefined,
      html: '<p>Hello Tester</p>',
    });

    // Cleanup
    fs.unlinkSync(templatePath);
  });

  it('should use dummy transporter when initialization fails', async () => {
    (nodemailer.createTransport as jest.Mock).mockImplementation(() => {
      throw new Error('Failed to create transport');
    });
    const errorService = new EmailService();
    await errorService.sendEmail({
      to: 'test@example.com',
      subject: 'Test Subject',
      text: 'Test Content',
    });
    // The dummy transporter should not throw an error
    expect(errorService).toBeDefined();
  });
});
