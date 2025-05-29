import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Provider } from '@prisma/client';
import { Strategy, Profile } from 'passport-google-oauth20';

import { normalizePermissions } from '@utils/normalizePermissions';

import { RoleEnum } from '../../roles/entities/role.entity';
import { AuthService } from '../auth.service';
import { IAuthenticatedUser } from '../dto/authenticate-user.dto';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private authService: AuthService) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: `${process.env.API_URL}/auth/google/callback`,
      scope: ['email', 'profile'],
      session: false,
      state: false,
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
  ): Promise<IAuthenticatedUser> {
    const user = await this.authService.validateOAuthLogin({
      provider: Provider.GOOGLE,
      profileId: profile.id,
      email: profile.emails![0].value,
      displayName: profile.displayName,
      roleId: RoleEnum.GOOGLE,
    });

    const permissions = normalizePermissions(user);

    return {
      sub: user.id,
      email: user.email,
      role: user.role.name,
      permissions,
    };
  }
}
