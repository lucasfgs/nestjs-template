import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { LoggerService } from './logger.service';

@Injectable()
export class PrismaLoggerService {
  constructor(private readonly logger: LoggerService) {}

  logQuery(query: Prisma.QueryEvent) {
    // Skip logging for SELECT operations
    if (query.query.toLowerCase().includes('select')) {
      return;
    }

    const params = JSON.stringify(query.params);
    const duration = `${query.duration}ms`;

    this.logger.log(
      `Query: ${query.query}\nParams: ${params}\nDuration: ${duration}`,
      'Prisma',
    );
  }

  logError(error: Prisma.LogEvent) {
    this.logger.error(`Prisma Error: ${error.message}`, error.target, 'Prisma');
  }

  logInfo(message: Prisma.LogEvent) {
    this.logger.log(`Prisma Info: ${message.message}`, 'Prisma');
  }

  logWarn(message: Prisma.LogEvent) {
    this.logger.warn(`Prisma Warning: ${message.message}`, 'Prisma');
  }
}
