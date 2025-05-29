import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { EmailService } from 'src/modules/shared/email/email.service';

import { User } from '../users/entity/user';
import { UsersService } from '../users/users.service';

import { jwtConstants } from './constants';
import { IAuthenticatedUser } from './dto/authenticate-user.dto';
import { RefreshTokenService } from './refresh-token.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private emailService: EmailService,
    private refreshTokenService: RefreshTokenService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByEmail(email, true);
    if (user && bcrypt.compareSync(password, user.password)) {
      return user;
    }
    return null;
  }

  async login(payload: IAuthenticatedUser) {
    return this.refreshTokenService.generateTokenPair(payload.sub, payload);
  }

  async refreshTokens(user: IAuthenticatedUser, oldToken: string) {
    const refreshToken = await this.refreshTokenService.rotateRefreshToken(
      user.sub,
      oldToken,
    );

    const accessToken = this.jwtService.sign(user, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: jwtConstants.accessExpiresIn,
    });
    return { accessToken, refreshToken };
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
