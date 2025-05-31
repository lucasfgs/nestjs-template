import { Injectable, LoggerService as RawLoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';
import 'winston-daily-rotate-file';

import { LOG_COLORS, LOG_DIR, LOG_LEVELS } from '@configs/logging.config';

@Injectable()
export class LoggerService implements RawLoggerService {
  private logger: winston.Logger;

  constructor(private configService: ConfigService) {
    const isDevelopment = this.configService.get('NODE_ENV') === 'development';

    this.logger = winston.createLogger({
      level: isDevelopment ? LOG_LEVELS.DEBUG : LOG_LEVELS.INFO,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
      defaultMeta: { service: 'api' },
      transports: [
        // Console transport for development
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize({ colors: LOG_COLORS }),
            winston.format.simple(),
          ),
        }),
        // File transport for all environments
        new winston.transports.DailyRotateFile({
          dirname: LOG_DIR,
          filename: 'error-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          level: LOG_LEVELS.ERROR,
          maxFiles: '14d',
        }),
        new winston.transports.DailyRotateFile({
          dirname: LOG_DIR,
          filename: 'combined-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxFiles: '14d',
        }),
      ],
    });
  }

  log(message: string, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, { trace, context });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, { context });
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(message, { context });
  }
}
