import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';

import { UsersService } from '../../users/users.service';
import { jwtConstants } from '../constants';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(private userService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.refreshSecret,
    });
  }

  async validate(payload: any) {
    const authUser = await this.userService.findOne(payload.sub, {
      withPermissions: true,
    });
    if (!authUser) {
      throw new UnauthorizedException();
    }

    return {
      ...authUser,
      refreshTokenExpiresAt: new Date(payload.exp * 1000),
    };
  }
}
