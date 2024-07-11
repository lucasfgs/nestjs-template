import { User } from '../../users/entity/user';

export class Role {
  id: string;
  name: string;
  users: User[];
}
