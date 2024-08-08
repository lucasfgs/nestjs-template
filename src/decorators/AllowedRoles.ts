import { SetMetadata } from '@nestjs/common';
import { Roles } from 'src/modules/api/roles/entities/role.entity';

export const ALLOWED_ROLES = 'allowedRoles';
export const AllowedRoles = (...allowedRoles: Roles[]) =>
  SetMetadata(ALLOWED_ROLES, allowedRoles);
