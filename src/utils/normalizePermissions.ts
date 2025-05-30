import { TPermission } from '@modules/api/core/auth/dto/authenticate-user.dto';

import { User } from '@modules/api/core/users/entity/user.entity';

export function normalizePermissions(user: User): TPermission[] {
  return user.role?.permissionRole?.map((permissionRole) => ({
    name: permissionRole.permission.name,
    create: permissionRole.create,
    read: permissionRole.read,
    update: permissionRole.update,
    delete: permissionRole.delete,
  }));
}
