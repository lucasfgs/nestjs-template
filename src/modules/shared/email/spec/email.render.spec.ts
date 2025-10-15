jest.mock('nodemailer', () => {
  const createTransport = jest.fn();
  return {
    createTransport,
    default: { createTransport },
  };
});

import * as fs from 'fs';
import * as path from 'path';

import { EmailService } from '../email.service';

describe('EmailService renderTemplate', () => {
  let service: EmailService;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    delete process.env.SMTP_FROM;
    service = new EmailService();
  });

  afterEach(() => {
    process.env = originalEnv;
    // cleanup created template if exists
    const templateDir = path.join(__dirname, '..', 'templates');
    const file = path.join(templateDir, 'render-test.hbs');
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
    }
  });

  it('renders a template with merged theme and templateData', async () => {
    const templateDir = path.join(__dirname, '..', 'templates');
    if (!fs.existsSync(templateDir)) fs.mkdirSync(templateDir);
    const templatePath = path.join(templateDir, 'render-test.hbs');
    fs.writeFileSync(
      templatePath,
      'Color: {{colors.primary}} - Name: {{name}}',
    );

    const html = await service.renderTemplate('render-test', { name: 'Alice' });
    expect(html).toContain('Name: Alice');
    // theme.json exists in the repo templates; ensure primary color was injected
    const themePath = path.join(templateDir, 'theme.json');
    if (fs.existsSync(themePath)) {
      const theme = JSON.parse(fs.readFileSync(themePath, 'utf8'));
      expect(html).toContain(theme.colors.primary);
    }
  });
});
