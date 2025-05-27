import { Permission } from '../../permissions/entities/permission.entity';
import { Role } from '../../roles/entities/role.entity';

export class PermissionRole {
  id: number;
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
  roleId: number;
  permissionId: number;
  permission: Permission;
  role: Role;
}
