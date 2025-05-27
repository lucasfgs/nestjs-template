import { Module } from '@nestjs/common';
import { EventsModule } from 'src/modules/shared/events/events.module';

import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';

@Module({
  controllers: [RolesController],
  providers: [RolesService],
  exports: [RolesService],
  imports: [EventsModule],
})
export class RolesModule {}
