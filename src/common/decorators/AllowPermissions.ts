import { SetMetadata } from '@nestjs/common';

import { EPermission } from '@modules/api/core/permissions/entities/permission.entity';

export const ALLOW_PERMISSIONS = 'allowPermissions';
export const AllowPermissions = (...allowedPermissions: EPermission[]) =>
  SetMetadata(ALLOW_PERMISSIONS, allowedPermissions);
