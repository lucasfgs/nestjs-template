import { Module } from '@nestjs/common';

import { PermissionsModule } from '../permissions/permissions.module';
import { RolesModule } from '../roles/roles.module';

import { PermissionRolesService } from './permission-roles.service';
import { PermissionRolesController } from './permission-roles.controller';

@Module({
  imports: [PermissionsModule, RolesModule],
  controllers: [PermissionRolesController],
  providers: [PermissionRolesService],
})
export class PermissionRolesModule {}
