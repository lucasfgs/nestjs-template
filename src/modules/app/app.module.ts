import { Module } from '@nestjs/common';
import { DevtoolsModule } from '@nestjs/devtools-integration';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { AuthModule } from '@modules/api/core/auth/auth.module';
import { PermissionRolesModule } from '@modules/api/core/permission-roles/permission-roles.module';
import { PermissionsModule } from '@modules/api/core/permissions/permissions.module';
import { RolesModule } from '@modules/api/core/roles/roles.module';
import { UsersModule } from '@modules/api/core/users/users.module';
import { HealthModule } from '@modules/api/health/health.module';
import { PaymentModule } from '@modules/api/payment/payment.module';
import { AppController } from '@modules/app/app.controller';
import { AppService } from '@modules/app/app.service';
import { EventsModule } from '@modules/shared/events/events.module';
import { PrismaModule } from '@modules/shared/prisma/prisma.module';
import { SseModule } from '@modules/shared/sse/sse.module';

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
