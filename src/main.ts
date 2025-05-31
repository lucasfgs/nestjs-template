import { HttpExceptionFilter } from '@common/filters/http-exception.filter';
import { TransformInterceptor } from '@common/interceptors/transform.interceptor';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import passport from 'passport';

import { validatorOptions } from '@configs/validator-options.config';

import { LoggerService } from '@modules/api/core/logging/logger.service';
import { AppModule } from '@modules/app/app.module';

import { CookieIoAdapter } from './common/adapters/cookie-io.adapter';

async function bootstrap() {
  const isProduction = process.env.NODE_ENV === 'production';
  const app = await NestFactory.create(AppModule, {
    snapshot: true,
    cors: {
      credentials: true,
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
      exposedHeaders: ['Set-Cookie'],
    },
    rawBody: true,
  });

  // Get logger instance
  const logger = app.get(LoggerService);

  // Middlewares
  app.use(cookieParser());
  app.use(passport.initialize());
  app.useWebSocketAdapter(new CookieIoAdapter(app));
  app.useGlobalPipes(new ValidationPipe(validatorOptions));
  app.useGlobalFilters(new HttpExceptionFilter(logger));
  app.useGlobalInterceptors(new TransformInterceptor());

  // Swagger
  if (!isProduction) {
    const config = new DocumentBuilder()
      .addBearerAuth()
      .setTitle('API example')
      .setDescription('This is an API example')
      .setVersion('1.0')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
  }

  // Session middleware
  if (process.env.SESSION_SECRET) {
    app.use(
      session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
          secure: isProduction,
        },
      }),
    );
  }

  await app.listen(process.env.API_PORT);
}
bootstrap();
