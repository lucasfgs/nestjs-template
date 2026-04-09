import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as crypto from 'crypto';

import { cookieConstants, jwtConstants } from '@configs/authentication.config';

import { PrismaService } from 'src/modules/shared/prisma/prisma.service';

import { IAuthenticatedUser } from './dto/authenticate-user.dto';

/**
 * Service to manage refresh tokens with a whitelist approach.
 * On login: generates and stores a new refresh token.
 * On refresh: validates and deletes the old token, then issues and stores a new one.
 */
@Injectable()
export class RefreshTokenService {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Generate a new refresh token and store it in the database.
   * If an existing refresh token is provided, validate and remove it first (rotate).
   */
  async rotateRefreshToken(
    userId: string,
    currentToken?: string,
  ): Promise<string> {
    if (currentToken) {
      const currentTokenHash = this.hashToken(currentToken);
      const existing = await this.prisma.refreshTokens.findFirst({
        where: { token: currentTokenHash, userId },
      });

      if (!existing || existing.expiresAt < new Date()) {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }

      await this.prisma.refreshTokens.delete({
        where: { id: existing.id },
      });
    }

    const newRefreshToken = this.jwtService.sign(
      { sub: userId },
      {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: jwtConstants.refreshExpiresIn,
      },
    );

    const maxAgeMs = cookieConstants.refresh.maxAge;
    const expiresAt = new Date(Date.now() + maxAgeMs);

    await this.prisma.refreshTokens.create({
      data: {
        token: this.hashToken(newRefreshToken),
        userId,
        expiresAt,
      },
    });

    return newRefreshToken;
  }

  /**
   * Generate both access and refresh tokens (login or refresh flow).
   */
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
      where: { token: this.hashToken(token), userId, expiresAt: { gt: new Date() } },
    });
  }

  async deleteById(id: string) {
    await this.prisma.refreshTokens.delete({ where: { id } });
  }

  /**
   * Scheduled cleanup of expired refresh tokens
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async clearExpiredRefreshTokens() {
    await this.prisma.refreshTokens.deleteMany({
      where: { expiresAt: { lte: new Date() } },
    });
  }
}
