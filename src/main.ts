import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

import { AppModule } from './modules/app/app.module';
import { validatorOptions } from './configs/validator-options';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    snapshot: true,
    cors: true,
  });

  // Middlewares
  app.useGlobalPipes(new ValidationPipe(validatorOptions));

  const config = new DocumentBuilder()
    .addBearerAuth()
    .setTitle('API example')
    .setDescription('This is an API example')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(process.env.API_PORT);
}
bootstrap();
