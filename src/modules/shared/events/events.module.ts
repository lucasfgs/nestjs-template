import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { EventsGateway } from './events.gateway';

@Module({
  providers: [EventsGateway],
  imports: [JwtModule],
})
export class EventsModule {}
