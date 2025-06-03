import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { IAuthenticatedUser } from '../dto/authenticate-user.dto';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request) => {
          return request?.cookies?.accessToken;
        },
        ExtractJwt.fromAuthHeaderAsBearerToken(), // fallback for auth header
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_ACCESS_SECRET,
    });
  }

  async validate(payload: IAuthenticatedUser) {
    const { sub, email, name, role, permissions } = payload;

    return {
      sub,
      email,
      name,
      role,
      permissions,
    };
  }
}
