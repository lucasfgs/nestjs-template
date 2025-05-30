import { APP_GUARD } from '@nestjs/core';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Test, TestingModule } from '@nestjs/testing';
import { Provider } from '@prisma/client';
import * as bcrypt from 'bcrypt';

import { EmailService } from 'src/modules/shared/email/email.service';
import { PrismaModule } from 'src/modules/shared/prisma/prisma.module';

import { UsersModule } from '../../users/users.module';
import { UsersService } from '../../users/users.service';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { jwtConstants } from '../constants';
import { IAuthenticatedUser, TPermission } from '../dto/authenticate-user.dto';
import { JwtAuthGuard } from '../guards/jwt.guard';
import { PermissionGuard } from '../guards/permission.guard';
import { RefreshTokenService } from '../refresh-token.service';
import { JwtStrategy } from '../strategies/jwt.strategy';
import { LocalStrategy } from '../strategies/local.strategy';

describe('AuthService', () => {
  let service: AuthService;
  let mockUsersService: jest.Mocked<Partial<UsersService>>;
  let mockJwtService: jest.Mocked<Partial<JwtService>>;

  const mockEmailService = {
    sendEmail: jest.fn(),
  };

  const mockRefreshTokenService = {
    generateTokenPair: jest.fn(),
    rotateRefreshToken: jest.fn(),
  };

  beforeEach(async () => {
    mockUsersService = {
      findByEmail: jest.fn(),
      findByProvider: jest.fn(),
      create: jest.fn(),
    };

    mockJwtService = {
      sign: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        PrismaModule,
        UsersModule,
        PassportModule,
        JwtModule.register({
          secret: 'test-secret',
          signOptions: { expiresIn: '1h' },
        }),
      ],
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
        {
          provide: RefreshTokenService,
          useValue: mockRefreshTokenService,
        },
        {
          provide: LocalStrategy,
          useValue: {},
        },
        {
          provide: JwtStrategy,
          useValue: {},
        },
        {
          provide: APP_GUARD,
          useClass: JwtAuthGuard,
        },
        {
          provide: APP_GUARD,
          useClass: PermissionGuard,
        },
      ],
      controllers: [AuthController],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user when credentials are valid', async () => {
      const mockUser = {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        password: await bcrypt.hash('password', 10),
        created_at: new Date(),
        updated_at: new Date(),
        roleId: 1,
        provider: Provider.LOCAL,
        providerId: 'local',
        role: {
          id: 1,
          name: 'user',
          description: 'desc',
          permissionRole: [],
        },
      };
      mockUsersService.findByEmail?.mockResolvedValue(mockUser);

      const result = await service.validateUser('test@example.com', 'password');

      expect(result).toEqual(mockUser);
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(
        'test@example.com',
        { returnPermissions: true },
      );
    });

    it('should return null when user is not found', async () => {
      mockUsersService.findByEmail?.mockResolvedValue(null);

      const result = await service.validateUser('test@example.com', 'password');

      expect(result).toBeNull();
    });

    it('should return null when password is invalid', async () => {
      const mockUser = {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        password: await bcrypt.hash('correct-password', 10),
        created_at: new Date(),
        updated_at: new Date(),
        roleId: 1,
        provider: Provider.LOCAL,
        providerId: 'local',
        role: {
          id: 1,
          name: 'user',
          description: 'desc',
          permissionRole: [],
        },
      };

      mockUsersService.findByEmail.mockResolvedValue(mockUser);

      const result = await service.validateUser(
        'test@example.com',
        'wrong-password',
      );

      expect(result).toBeNull();
    });
  });

  describe('validateOAuthLogin', () => {
    it('should return existing user when found', async () => {
      const mockUser = {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        password: 'password',
        created_at: new Date(),
        updated_at: new Date(),
        roleId: 1,
        provider: Provider.GOOGLE,
        providerId: 'google-id',
        role: {
          id: 1,
          name: 'user',
          description: 'desc',
          permissionRole: [],
        },
      };

      mockUsersService.findByProvider.mockResolvedValue(mockUser);

      const result = await service.validateOAuthLogin({
        provider: Provider.GOOGLE,
        profileId: 'google-id',
        email: 'test@example.com',
        displayName: 'Test User',
        roleId: 1,
      });

      expect(result).toEqual(mockUser);
      expect(mockUsersService.findByProvider).toHaveBeenCalledWith(
        Provider.GOOGLE,
        'google-id',
        { returnPermissions: true },
      );
    });

    it('should create new user when not found', async () => {
      const mockUser = {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        password: 'password',
        created_at: new Date(),
        updated_at: new Date(),
        roleId: 1,
        provider: Provider.GOOGLE,
        providerId: 'google-id',
        role: {
          id: 1,
          name: 'user',
          description: 'desc',
          permissionRole: [],
        },
      };

      mockUsersService.findByProvider.mockResolvedValue(null);
      mockUsersService.create.mockResolvedValue(mockUser);

      const result = await service.validateOAuthLogin({
        provider: Provider.GOOGLE,
        profileId: 'google-id',
        email: 'test@example.com',
        displayName: 'Test User',
        roleId: 1,
      });

      expect(result).toEqual(mockUser);
      expect(mockUsersService.create).toHaveBeenCalledWith(
        {
          email: 'test@example.com',
          name: 'Test User',
          provider: Provider.GOOGLE,
          providerId: 'google-id',
          roleId: 1,
        },
        { returnPermissions: true },
      );
    });
  });

  describe('login', () => {
    it('should return access and refresh tokens', async () => {
      const mockUser: IAuthenticatedUser = {
        sub: '1',
        email: 'test@example.com',
        role: 'user',
        permissions: [],
      };
      const mockTokenPair = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };
      mockRefreshTokenService.generateTokenPair.mockResolvedValue(
        mockTokenPair,
      );

      const result = await service.login(mockUser);

      expect(result).toEqual(mockTokenPair);
      expect(mockRefreshTokenService.generateTokenPair).toHaveBeenCalledWith(
        mockUser.sub,
        mockUser,
      );
    });
  });

  describe('refreshTokens', () => {
    it('should rotate refresh token and generate new access token', async () => {
      const mockPermission: TPermission = {
        name: 'test',
        create: true,
        read: true,
        update: true,
        delete: true,
      };

      const mockUser: IAuthenticatedUser = {
        sub: '1',
        email: 'test@example.com',
        role: 'user',
        permissions: [mockPermission],
      };
      const mockRefreshToken = 'new-refresh-token';
      const mockAccessToken = 'new-access-token';

      mockRefreshTokenService.rotateRefreshToken.mockResolvedValue(
        mockRefreshToken,
      );
      mockJwtService.sign.mockReturnValue(mockAccessToken);

      const result = await service.refreshTokens(mockUser, 'old-refresh-token');

      expect(result).toEqual({
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
      });
      expect(mockRefreshTokenService.rotateRefreshToken).toHaveBeenCalledWith(
        mockUser.sub,
        'old-refresh-token',
      );
      expect(mockJwtService.sign).toHaveBeenCalledWith(mockUser, {
        secret: process.env.JWT_ACCESS_SECRET,
        expiresIn: jwtConstants.accessExpiresIn,
      });
    });
  });

  describe('forgotPassword', () => {
    it('should generate code and send email', async () => {
      const email = 'test@example.com';
      jest.spyOn(Math, 'random').mockReturnValue(0.5);

      const result = await service.forgotPassword(email);

      expect(result).toBe(550000); // 100000 + 0.5 * 900000
      expect(mockEmailService.sendEmail).toHaveBeenCalledWith({
        subject: 'Reset Password',
        to: email,
        text: expect.stringContaining('550000'),
      });
    });
  });
});
