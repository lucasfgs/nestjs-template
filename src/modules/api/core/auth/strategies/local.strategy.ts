import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';

import { normalizePermissions } from '@utils/normalizePermissions';

import { AuthService } from '../auth.service';
import { IAuthenticatedUser } from '../dto/authenticate-user.dto';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'email',
    });
  }

  async validate(email: string, password: string): Promise<IAuthenticatedUser> {
    const user = await this.authService.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException();
    }

    const normalizedPermissions = normalizePermissions(user);

    return {
      sub: user.id,
      email: user.email,
      role: user.role.name,
      permissions: normalizedPermissions,
    };
  }
}
