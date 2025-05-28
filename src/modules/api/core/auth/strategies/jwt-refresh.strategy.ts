import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { normalizePermissions } from '@utils/normalizePermissions';

import { UsersService } from '../../users/users.service';
import { IAuthenticatedUser } from '../dto/authenticate-user.dto';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(private usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request) => {
          return request?.cookies?.refreshToken;
        },
      ]),
      secretOrKey: process.env.JWT_REFRESH_SECRET,
      ignoreExpiration: false,
      passReqToCallback: true,
    });
  }

  async validate(
    req: any,
    payload: IAuthenticatedUser,
  ): Promise<IAuthenticatedUser> {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    const authUser = await this.usersService.findOne(payload.sub, {
      withPermissions: true,
    });
    if (!authUser) {
      throw new UnauthorizedException();
    }

    return {
      sub: authUser.id,
      email: authUser.email,
      role: authUser.role.name,
      permissions: normalizePermissions(authUser),
    };
  }
}
