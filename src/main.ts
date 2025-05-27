import { HttpExceptionFilter } from '@interceptors/http-exception.interceptor';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import session from 'express-session';

import { validatorOptions } from '@configs/validator-options';

import { sessionConstants } from '@modules/api/core/auth/constants';
import { AppModule } from '@modules/app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    snapshot: true,
    cors: {
      credentials: true,
      origin: 'http://localhost:3000',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    },
    rawBody: true,
  });

  // Middlewares
  app.useGlobalPipes(new ValidationPipe(validatorOptions));
  app.useGlobalFilters(new HttpExceptionFilter());

  const config = new DocumentBuilder()
    .addBearerAuth()
    .setTitle('API example')
    .setDescription('This is an API example')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  app.use(
    session({
      secret: sessionConstants.secret,
      resave: false,
      saveUninitialized: false,
    }),
  );

  await app.listen(process.env.API_PORT);
}
bootstrap();
