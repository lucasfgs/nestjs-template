import { Module } from '@nestjs/common';

// Import related modules
import { PrismaModule } from '@modules/shared/prisma/prisma.module';

// Import local components
import { FileUploadController } from './media.controller';
import { FileUploadService } from './media.service';

@Module({
  imports: [PrismaModule],
  controllers: [FileUploadController],
  providers: [FileUploadService],
  exports: [FileUploadService],
})
export class FileUploadModule {}
