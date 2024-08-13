export class Permission {
  id: number;
  name: string;
}

export enum EPermission {
  USERS = 'users',
  ROLES = 'roles',
  PERMISSION_ROLES = 'permission_roles',
}
