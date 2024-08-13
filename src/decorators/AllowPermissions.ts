import { SetMetadata } from '@nestjs/common';
import { EPermission } from 'src/modules/api/permissions/entities/permission.entity';

export const ALLOW_PERMISSIONS = 'allowPermissions';
export const AllowPermissions = (...allowedPermissions: EPermission[]) =>
  SetMetadata(ALLOW_PERMISSIONS, allowedPermissions);
