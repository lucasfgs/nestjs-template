import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Cron, CronExpression } from '@nestjs/schedule';
import { createHash, randomUUID } from 'crypto';

import { cookieConstants, jwtConstants } from '@configs/authentication.config';

import { PrismaService } from 'src/modules/shared/prisma/prisma.service';

import { IAuthenticatedUser } from './dto/authenticate-user.dto';

/**
 * Service to manage refresh tokens with a whitelist approach.
 * Refresh tokens are stored as hashes so the raw token is never persisted.
 */
@Injectable()
export class RefreshTokenService {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private async deleteTokenRecord(id: string): Promise<void> {
    try {
      await this.prisma.refreshTokens.delete({ where: { id } });
    } catch {
      return;
    }
  }

  async rotateRefreshToken(
    userId: string,
    currentToken?: string,
  ): Promise<string> {
    if (currentToken) {
      const currentTokenHash = this.hashToken(currentToken);
      const existing = await this.prisma.refreshTokens.findFirst({
        where: { tokenHash: currentTokenHash, userId },
      });

      if (!existing || existing.expiresAt < new Date()) {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }

      await this.deleteTokenRecord(existing.id);
    }

    const refreshJti = randomUUID();
    const newRefreshToken = this.jwtService.sign(
      { sub: userId, jti: refreshJti },
      {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: jwtConstants.refreshExpiresIn,
      },
    );

    const maxAgeMs = cookieConstants.refresh.maxAge;
    const expiresAt = new Date(Date.now() + maxAgeMs);

    await this.prisma.refreshTokens.create({
      data: {
        tokenHash: this.hashToken(newRefreshToken),
        tokenId: refreshJti,
        userId,
        expiresAt,
      },
    });

    return newRefreshToken;
  }

  async generateTokenPair(
    userId: string,
    payload: IAuthenticatedUser,
    currentRefreshToken?: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: jwtConstants.accessExpiresIn,
    });

    const refreshToken = await this.rotateRefreshToken(
      userId,
      currentRefreshToken,
    );

    return { accessToken, refreshToken };
  }

  async findTokenRecord(token: string, userId: string) {
    return this.prisma.refreshTokens.findFirst({
      where: { tokenHash: this.hashToken(token), userId, expiresAt: { gt: new Date() } },
    });
  }

  async deleteById(id: string) {
    await this.prisma.refreshTokens.delete({ where: { id } });
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async clearExpiredRefreshTokens() {
    await this.prisma.refreshTokens.deleteMany({
      where: { expiresAt: { lte: new Date() } },
    });
  }
}
