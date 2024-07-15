import { Module } from '@nestjs/common';
import { DevtoolsModule } from '@nestjs/devtools-integration';

import { UsersModule } from '../api/users/users.module';
import { HealthModule } from '../api/health/health.module';
import { AuthModule } from '../api/auth/auth.module';
import { PrismaModule } from '../shared/prisma/prisma.module';
import { RolesModule } from '../api/roles/roles.module';
import { PermissionsModule } from '../api/permissions/permissions.module';
import { PermissionRolesModule } from '../api/permission-roles/permission-roles.module';

import { AppService } from './app.service';
import { AppController } from './app.controller';

@Module({
  imports: [
    PrismaModule,
    DevtoolsModule.register({
      http: process.env.NODE_ENV !== 'production',
    }),
    HealthModule,
    AuthModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    PermissionRolesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
