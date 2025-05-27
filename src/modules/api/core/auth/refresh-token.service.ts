import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/modules/shared/prisma/prisma.service';

import { User } from '../users/entity/user';

import { jwtConstants } from './constants';
import { IAuthenticatedUser } from './dto/authenticate-user.dto';

@Injectable()
export class RefreshTokenService {
  constructor(
    private jwtService: JwtService,
    private prismaService: PrismaService,
  ) {}

  async generateRefreshToken(
    authUserId: string,
    currentRefreshToken?: string,
    currentRefreshTokenExpiresAt?: Date,
  ) {
    const newRefreshToken = this.jwtService.sign(
      { sub: authUserId },
      {
        secret: jwtConstants.refreshSecret,
        expiresIn: jwtConstants.refreshExpiresIn,
      },
    );

    if (currentRefreshToken && currentRefreshTokenExpiresAt) {
      if (
        await this.isRefreshTokenBlackListed(currentRefreshToken, authUserId)
      ) {
        throw new UnauthorizedException('Invalid refresh token.');
      }

      await this.prismaService.refreshTokens.create({
        data: {
          token: currentRefreshToken,
          expiresAt: currentRefreshTokenExpiresAt,
          userId: authUserId,
        },
      });
    }

    return newRefreshToken;
  }

  private isRefreshTokenBlackListed(token: string, userId: string) {
    return this.prismaService.refreshTokens.findFirst({
      where: {
        token,
        userId,
      },
    });
  }

  async generateTokenPair(
    user: User,
    payload: IAuthenticatedUser,
    currentRefreshToken?: string,
    currentRefreshTokenExpiresAt?: Date,
  ) {
    return {
      accessToken: this.jwtService.sign(payload), // jwt module is configured in auth.module.ts for access token
      refreshToken: await this.generateRefreshToken(
        user.id,
        currentRefreshToken,
        currentRefreshTokenExpiresAt,
      ),
    };
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async clearExpiredRefreshTokens() {
    await this.prismaService.refreshTokens.deleteMany({
      where: {
        expiresAt: {
          lte: new Date(),
        },
      },
    });
  }
}
