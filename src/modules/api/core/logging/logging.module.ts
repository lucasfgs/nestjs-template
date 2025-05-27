import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { LoggerService } from './logger.service';
import { PrismaLoggerService } from './prisma-logger.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [LoggerService, PrismaLoggerService],
  exports: [LoggerService, PrismaLoggerService],
})
export class LoggingModule {}
