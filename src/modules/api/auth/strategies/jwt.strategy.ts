import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

import { jwtConstants } from '../constants';
import { IAuthenticatedUser } from '../dto/authenticate-user.dto';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret,
    });
  }

  async validate(payload: IAuthenticatedUser) {
    const { sub, email, role, permissions } = payload;
    return {
      sub,
      email,
      role,
      permissions,
    };
  }
}
