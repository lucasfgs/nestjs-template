export class Permission {
  id: number;
  name: string;
  description: string;
}

export enum EPermission {
  USERS = 'users',
  ROLES = 'roles',
  PERMISSION_ROLES = 'permission_roles',
}
