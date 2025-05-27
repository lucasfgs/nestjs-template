import { Global, Module } from '@nestjs/common';

import { LoggingModule } from '@modules/api/core/logging/logging.module';

import { PrismaService } from './prisma.service';

@Global()
@Module({
  imports: [LoggingModule],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
