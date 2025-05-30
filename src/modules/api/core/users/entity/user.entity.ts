import { Provider } from '@prisma/client';
import { Exclude } from 'class-transformer';

import { PermissionRole } from '../../permission-roles/entities/permission-role.entity';
import { Role } from '../../roles/entities/role.entity';

interface IRole extends Partial<Role> {
  permissionRole: Partial<PermissionRole>[] | null;
}

export class User {
  id: string;
  name: string;
  email: string;
  @Exclude()
  password: string;
  roleId: number;
  role: IRole;
  provider: Provider;
  providerId: string;
}

export type UserWithoutPassword = Omit<User, 'password'>;
