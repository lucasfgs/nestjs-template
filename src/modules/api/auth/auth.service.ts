import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { EmailService } from 'src/modules/shared/email/email.service';
import { normalizePermissions } from 'src/utils/normalizePermissions';

import { UsersService } from '../users/users.service';
import { User, UserWithoutPassword } from '../users/entity/user';

import { RefreshTokenService } from './refresh-token.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private emailService: EmailService,
    private refreshTokenService: RefreshTokenService,
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

  async login(user: User) {
    const normalizedPermissions = normalizePermissions(user);

    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role.name,
      permissions: normalizedPermissions,
    };

    return this.refreshTokenService.generateTokenPair(user, payload);
  }

  async forgotPassword(email: string): Promise<number> {
    // Generate a random 6 digits code
    const code = Math.floor(100000 + Math.random() * 900000);

    // Implementation for sending password reset email
    await this.emailService.sendEmail({
      subject: 'Reset Password',
      to: email,
      text: `Click on this link to reset your password: ${code}`,
    });

    return code;
  }
}
