import { TPermission } from 'src/modules/api/auth/dto/authenticate-user.dto';
import { User } from 'src/modules/api/users/entity/user';

export function normalizePermissions(user: User): TPermission[] {
  return user.role?.permissionRole?.map((permissionRole) => ({
    name: permissionRole.permission.name,
    create: permissionRole.create,
    read: permissionRole.read,
    update: permissionRole.update,
    delete: permissionRole.delete,
  }));
}
