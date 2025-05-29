import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { ExtractJwt } from 'passport-jwt';

import { normalizePermissions } from '@utils/normalizePermissions';

import { UsersService } from '../../users/users.service';
import { IAuthenticatedUser } from '../dto/authenticate-user.dto';
import { RefreshTokenService } from '../refresh-token.service';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    private refreshTokenService: RefreshTokenService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req) => req.cookies?.refreshToken,
      ]),
      secretOrKey: process.env.JWT_REFRESH_SECRET,
      passReqToCallback: true,
    });
  }

  async validate(req: any, payload: IAuthenticatedUser) {
    const token = req.cookies['refreshToken'];
    if (!token) throw new UnauthorizedException('No refresh token');

    // Check whitelist
    const stored = await this.refreshTokenService.findTokenRecord(
      token,
      payload.sub,
    );
    if (!stored) {
      throw new UnauthorizedException('Refresh token revoked or expired');
    }

    const user = await this.usersService.findOne(payload.sub, {
      withPermissions: true,
    });
    if (!user) throw new UnauthorizedException();

    return {
      sub: user.id,
      email: user.email,
      role: user.role.name,
      permissions: normalizePermissions(user),
    };
  }
}
