import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';

import { PrismaLoggerService } from '@modules/api/core/logging/prisma-logger.service';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(private readonly prismaLogger: PrismaLoggerService) {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'info' },
        { emit: 'event', level: 'warn' },
      ],
    });

    // Bind event handlers
    this.$on('query' as never, (e: Prisma.QueryEvent) =>
      this.prismaLogger.logQuery(e),
    );
    this.$on('error' as never, (e: Prisma.LogEvent) =>
      this.prismaLogger.logError(e),
    );
    this.$on('info' as never, (e: Prisma.LogEvent) =>
      this.prismaLogger.logInfo(e),
    );
    this.$on('warn' as never, (e: Prisma.LogEvent) =>
      this.prismaLogger.logWarn(e),
    );
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
