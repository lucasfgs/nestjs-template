import { User } from '../../users/entity/user';

export class Role {
  id: number;
  name: string;
  users: User[];
}

export enum Roles {
  ADMIN = 'admin',
  GUEST = 'guest',
}
