import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

import { UsersService } from '../users/users.service';
import { User, UserWithoutPassword } from '../users/entity/user';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(
    email: string,
    password: string,
  ): Promise<UserWithoutPassword | null> {
    const user = await this.usersService.findByEmail(email, true);
    if (user && bcrypt.compareSync(password, user.password)) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user;
      return result as UserWithoutPassword;
    }
    return null;
  }

  login(user: User): { access_token: string } {
    const normalizedPermissions = user.role?.permissionRole?.map(
      (permissionRole) => ({
        name: permissionRole.permission.name,
        create: permissionRole.create,
        read: permissionRole.read,
        update: permissionRole.update,
        delete: permissionRole.delete,
      }),
    );
    const payload = {
      email: user.email,
      sub: user.id,
      permissions: normalizedPermissions,
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
