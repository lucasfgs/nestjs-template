export class User {
  id: string;
  name: string;
  email: string;
  password: string;
  roleId: number;
  role: {
    id: number;
    name: string;
  };
}

export type UserWithoutPassword = Omit<User, 'password'>;
