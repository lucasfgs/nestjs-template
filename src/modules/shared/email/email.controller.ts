import * as fs from 'fs';
import * as path from 'path';

import {
  Controller,
  Req,
  UseGuards,
  ForbiddenException,
  Header,
  Get,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '@modules/api/core/auth/guards/jwt.guard';

import { Public } from '@common/decorators/Public';

import { EmailTemplate } from './email-templates.enum';
import { EmailService } from './email.service';

@ApiTags('email')
@ApiBearerAuth()
@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @UseGuards(JwtAuthGuard)
  @Get('preview')
  @Public()
  @Header('Content-Type', 'text/html')
  @ApiOperation({
    summary: 'Preview an email template (disabled in production)',
    description: `Predefined example templateData (used for browser testing)`,
  })
  @ApiQuery({
    name: 'template',
    enum: EmailTemplate,
    required: false,
    description: 'The template to preview (defaults to submit-leads)',
  })
  async preview(
    @Req() req: any,
    @Query('template') template?: EmailTemplate,
    @Query('raw') raw?: string,
  ) {
    // This endpoint must not be available in production
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException('Email preview is disabled in production');
    }

    const tpl = (template as EmailTemplate) || EmailTemplate.SUBMIT_LEADS;

    // Hard-coded example data for browser previewing
    const examples: Record<string, Record<string, unknown>> = {
      [EmailTemplate.WELCOME]: {
        firstName: 'Jane',
        signInUrl: 'https://app.example.com/login',
      },
      [EmailTemplate.PASSWORD_RESET]: {
        firstName: 'Jane',
        resetUrl: 'https://app.example.com/reset?token=abc123',
      },
      [EmailTemplate.NOTIFICATION]: {
        firstName: 'Jane',
        subject: 'Account Update',
        message: 'Your account settings were updated',
      },
      [EmailTemplate.SUBMIT_LEADS]: {
        firstName: 'Jane',
        email: 'jane@example.com',
        phone: '555-123-4567',
        message: 'I am interested in this property. Please contact me.',
        listing: {
          name: 'Nice Apartment',
          url: 'https://example.com/listings/1',
        },
        requestApp: true,
        confirmAvail: false,
        virtualTour: true,
      },
      [EmailTemplate.TEST_TEMPLATE]: {
        any: 'value',
      },
    };

    // Load theme.json from compiled or source templates folder so previews use theme
    const loadTheme = () => {
      const candidates = [
        path.join(__dirname, 'templates', 'theme.json'),
        path.join(
          process.cwd(),
          'src/modules/shared/email/templates/theme.json',
        ),
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
      for (const p of candidates) {
        try {
          if (fs.existsSync(p)) {
            const raw = fs.readFileSync(p, 'utf8');
            return JSON.parse(raw);
          }
        } catch (err) {
          // ignore and continue
        }
      }
      return { colors: {} };
    };

    const theme = loadTheme();

    const templateData = Object.assign({}, examples[tpl] || {}, {
      colors: theme.colors || {},
    });

    const html = await this.emailService.renderTemplate(tpl, templateData);

    // If ?raw=1 is present, return the raw rendered HTML (no wrapper)
    if (raw === '1' || raw === 'true') return html;

    // Otherwise, return a simple preview wrapper to simulate an email client
    const primary =
      (theme && theme.colors && theme.colors.primary) || '#03A095';
    const bg = (theme && theme.colors && theme.colors.background) || '#f3f4f6';
    const muted = (theme && theme.colors && theme.colors.muted) || '#64748b';

    const wrapper = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Email Preview - ${tpl}</title>
    <style>
  body { background: ${bg}; margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
      .preview-shell { display:flex; justify-content:center; }
      .preview-container { max-width: 680px; width: 100%; box-shadow: 0 4px 18px rgba(2,6,23,0.08); border-radius: 8px; overflow: hidden; background: #fff; }
      .preview-toolbar { background: ${theme.colors && theme.colors.background ? theme.colors.background : '#ffffff'}; padding: 10px 14px; display:flex; gap:8px; align-items:center; border-bottom:1px solid rgba(230,237,243,0.9); }
      .dot { width:12px; height:12px; border-radius:999px; display:inline-block; }
      .dot.red { background: #ff5f56 } .dot.yellow { background: #ffbd2e } .dot.green { background: #27c93f }
      .preview-body { padding: 0; }
      .preview-toolbar .title { flex:1; text-align:center; font-size:12px; color: ${muted}; }
      .preview-toolbar .accent { width:12px; height:12px; border-radius:3px; background: ${primary}; display:inline-block; margin-right:8px; }
    </style>
  </head>
  <body>
    <div class="preview-shell">
      <div class="preview-container">
        <div class="preview-toolbar">
          <span class="accent"></span>
          <div class="title">Preview: ${tpl}</div>
        </div>
        <div class="preview-body">
          ${html}
        </div>
      </div>
    </div>
  </body>
</html>`;

    return wrapper;
  }
}
