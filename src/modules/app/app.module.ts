import { Module } from '@nestjs/common';
import { DevtoolsModule } from '@nestjs/devtools-integration';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { UsersModule } from '../api/users/users.module';
import { HealthModule } from '../api/health/health.module';
import { AuthModule } from '../api/auth/auth.module';
import { PrismaModule } from '../shared/prisma/prisma.module';
import { RolesModule } from '../api/roles/roles.module';
import { PermissionsModule } from '../api/permissions/permissions.module';
import { PermissionRolesModule } from '../api/permission-roles/permission-roles.module';
import { SseModule } from '../shared/sse/sse.module';
import { PaymentModule } from '../api/payment/payment.module';
import { EventsModule } from '../shared/events/events.module';

import { AppService } from './app.service';
import { AppController } from './app.controller';

@Module({
  imports: [
    PrismaModule,
    SseModule,
    DevtoolsModule.register({
      http: process.env.NODE_ENV !== 'production',
    }),
    EventEmitterModule.forRoot(),
    HealthModule,
    AuthModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    PermissionRolesModule,
    PaymentModule,
    EventsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
