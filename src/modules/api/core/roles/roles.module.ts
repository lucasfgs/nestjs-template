import { Module } from '@nestjs/common';

import { EventsModule } from 'src/modules/shared/events/events.module';

import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';

@Module({
  controllers: [RolesController],
  providers: [RolesService],
  exports: [RolesService],
  imports: [EventsModule],
})
export class RolesModule {}
