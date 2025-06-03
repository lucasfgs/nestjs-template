import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';

import { cookieConstants, jwtConstants } from '@configs/authentication.config';

import { PrismaService } from 'src/modules/shared/prisma/prisma.service';

import { IAuthenticatedUser } from '../dto/authenticate-user.dto';
import { RefreshTokenService } from '../refresh-token.service';

describe('RefreshTokenService', () => {
  let service: RefreshTokenService;
  let jwtService: jest.Mocked<JwtService>;
  let prismaService: jest.Mocked<PrismaService>;

  const mockUser: IAuthenticatedUser = {
    sub: '1',
    email: 'test@example.com',
    name: 'test',
    role: 'user',
    permissions: [],
  };

  const mockRefreshToken = 'mock-refresh-token';
  const mockAccessToken = 'mock-access-token';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshTokenService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            refreshTokens: {
              findFirst: jest
                .fn()
                .mockImplementation(() => Promise.resolve(null)),
              create: jest.fn().mockImplementation(() => Promise.resolve(null)),
              delete: jest.fn().mockImplementation(() => Promise.resolve(null)),
              deleteMany: jest
                .fn()
                .mockImplementation(() => Promise.resolve({ count: 0 })),
            },
          },
        },
      ],
    }).compile();

    service = module.get<RefreshTokenService>(RefreshTokenService);
    jwtService = module.get(JwtService);
    prismaService = module.get(PrismaService);

    // Mock JWT signing
    jwtService.sign.mockReturnValue(mockRefreshToken);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('rotateRefreshToken', () => {
    it('should generate and store a new refresh token without current token', async () => {
      const expiresAt = new Date(Date.now() + cookieConstants.refresh.maxAge);

      (prismaService.refreshTokens.create as jest.Mock).mockResolvedValue({
        id: '1',
        token: mockRefreshToken,
        userId: mockUser.sub,
        expiresAt,
      });

      const result = await service.rotateRefreshToken(mockUser.sub);

      expect(result).toBe(mockRefreshToken);
      expect(jwtService.sign).toHaveBeenCalledWith(
        { sub: mockUser.sub },
        {
          secret: process.env.JWT_REFRESH_SECRET,
          expiresIn: jwtConstants.refreshExpiresIn,
        },
      );
      expect(prismaService.refreshTokens.create).toHaveBeenCalledWith({
        data: {
          token: mockRefreshToken,
          userId: mockUser.sub,
          expiresAt: expect.any(Date),
        },
      });
    });

    it('should validate and delete current token before generating new one', async () => {
      const currentToken = 'current-token';
      const expiresAt = new Date(Date.now() + cookieConstants.refresh.maxAge);

      (prismaService.refreshTokens.findFirst as jest.Mock).mockResolvedValue({
        id: '1',
        token: currentToken,
        userId: mockUser.sub,
        expiresAt: new Date(Date.now() + 1000), // Not expired
      });

      (prismaService.refreshTokens.create as jest.Mock).mockResolvedValue({
        id: '2',
        token: mockRefreshToken,
        userId: mockUser.sub,
        expiresAt,
      });

      const result = await service.rotateRefreshToken(
        mockUser.sub,
        currentToken,
      );

      expect(result).toBe(mockRefreshToken);
      expect(prismaService.refreshTokens.findFirst).toHaveBeenCalledWith({
        where: { token: currentToken, userId: mockUser.sub },
      });
      expect(prismaService.refreshTokens.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should throw UnauthorizedException for invalid current token', async () => {
      const currentToken = 'invalid-token';

      (prismaService.refreshTokens.findFirst as jest.Mock).mockResolvedValue(
        null,
      );

      await expect(
        service.rotateRefreshToken(mockUser.sub, currentToken),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for expired current token', async () => {
      const currentToken = 'expired-token';

      (prismaService.refreshTokens.findFirst as jest.Mock).mockResolvedValue({
        id: '1',
        token: currentToken,
        userId: mockUser.sub,
        expiresAt: new Date(Date.now() - 1000), // Expired
      });

      await expect(
        service.rotateRefreshToken(mockUser.sub, currentToken),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('generateTokenPair', () => {
    it('should generate both access and refresh tokens', async () => {
      jwtService.sign
        .mockReturnValueOnce(mockAccessToken)
        .mockReturnValueOnce(mockRefreshToken);

      const expiresAt = new Date(Date.now() + cookieConstants.refresh.maxAge);

      (prismaService.refreshTokens.create as jest.Mock).mockResolvedValue({
        id: '1',
        token: mockRefreshToken,
        userId: mockUser.sub,
        expiresAt,
      });

      const result = await service.generateTokenPair(mockUser.sub, mockUser);

      expect(result).toEqual({
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
      });
      expect(jwtService.sign).toHaveBeenCalledTimes(2);
      expect(jwtService.sign).toHaveBeenCalledWith(mockUser, {
        secret: process.env.JWT_ACCESS_SECRET,
        expiresIn: jwtConstants.accessExpiresIn,
      });
    });
  });

  describe('findTokenRecord', () => {
    it('should find a valid token record', async () => {
      const token = 'valid-token';
      const mockRecord = {
        id: '1',
        token,
        userId: mockUser.sub,
        expiresAt: new Date(Date.now() + 1000),
      };

      (prismaService.refreshTokens.findFirst as jest.Mock).mockResolvedValue(
        mockRecord,
      );

      const result = await service.findTokenRecord(token, mockUser.sub);

      expect(result).toEqual(mockRecord);
      expect(prismaService.refreshTokens.findFirst).toHaveBeenCalledWith({
        where: {
          token,
          userId: mockUser.sub,
          expiresAt: { gt: expect.any(Date) },
        },
      });
    });

    it('should return null for non-existent token', async () => {
      (prismaService.refreshTokens.findFirst as jest.Mock).mockResolvedValue(
        null,
      );

      const result = await service.findTokenRecord(
        'non-existent',
        mockUser.sub,
      );

      expect(result).toBeNull();
    });
  });

  describe('deleteById', () => {
    it('should delete a token record by id', async () => {
      const tokenId = '1';

      await service.deleteById(tokenId);

      expect(prismaService.refreshTokens.delete).toHaveBeenCalledWith({
        where: { id: tokenId },
      });
    });
  });

  describe('clearExpiredRefreshTokens', () => {
    it('should delete all expired tokens', async () => {
      await service.clearExpiredRefreshTokens();

      expect(prismaService.refreshTokens.deleteMany).toHaveBeenCalledWith({
        where: { expiresAt: { lte: expect.any(Date) } },
      });
    });
  });
});
