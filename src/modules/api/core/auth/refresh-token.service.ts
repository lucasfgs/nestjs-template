import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Cron, CronExpression } from '@nestjs/schedule';

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

  /**
   * Generate a new refresh token and store it in the database.
   * If an existing refresh token is provided, validate and remove it first (rotate).
   */
  async rotateRefreshToken(
    userId: string,
    currentToken?: string,
  ): Promise<string> {
    // If a current refresh token is provided, validate and remove it
    if (currentToken) {
      const existing = await this.prisma.refreshTokens.findFirst({
        where: { token: currentToken, userId },
      });

      if (!existing || existing.expiresAt < new Date()) {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }
      // Whitelist model: delete the old token
      await this.prisma.refreshTokens.delete({
        where: { id: existing.id },
      });
    }

    // Sign a new JWT refresh token
    const newRefreshToken = this.jwtService.sign(
      { sub: userId },
      {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: jwtConstants.refreshExpiresIn,
      },
    );

    // Compute expiration date
    const maxAgeMs = cookieConstants.refresh.maxAge;
    const expiresAt = new Date(Date.now() + maxAgeMs);

    // Store in whitelist table
    await this.prisma.refreshTokens.create({
      data: {
        token: newRefreshToken,
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
      where: { token, userId, expiresAt: { gt: new Date() } },
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
