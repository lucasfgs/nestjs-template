import { User } from '../../users/entity/user';

export class Role {
  id: number;
  name: string;
  description: string;
  users: User[];
}
