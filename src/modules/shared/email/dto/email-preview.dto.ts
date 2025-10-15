import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsObject, IsOptional } from 'class-validator';

import { EmailTemplate } from '../email-templates.enum';

export class EmailPreviewDto {
  @IsNotEmpty()
  @IsEnum(EmailTemplate)
  @ApiProperty({
    enum: EmailTemplate,
    example: EmailTemplate.SUBMIT_LEADS,
    description: 'The template to render',
  })
  template: EmailTemplate;

  @IsOptional()
  @IsObject()
  @ApiProperty({
    required: false,
    example: { firstName: 'Jane', listing: { name: 'Nice Apartment' } },
    description:
      'An object with template variables used when rendering the template',
  })
  templateData?: Record<string, unknown>;
}
