import { User } from '../../users/entity/user';

export class Role {
  id: number;
  name: string;
  description: string;
  users: User[];
}

export enum RoleEnum {
  ADMIN = 1,
  GUEST = 2,
  GOOGLE = 3,
}
