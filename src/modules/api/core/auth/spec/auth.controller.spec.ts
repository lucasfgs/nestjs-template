import {
  GoneException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';

import { cookieConstants } from '@configs/authentication.config';

import { UsersService } from '../../users/users.service';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { AuthenticateUserDto } from '../dto/authenticate-user.dto';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { VerifyPasswordCodeDto } from '../dto/verify-password-code.dto';
import { RefreshTokenService } from '../refresh-token.service';

interface ISession {
  forgotPasswordEmail?: string | null;
  forgotPasswordCode?: string | null;
}

describe('AuthController', () => {
  let controller: AuthController;
  let mockAuthService: jest.Mocked<AuthService>;
  let mockRefreshTokenService: jest.Mocked<RefreshTokenService>;
  let mockResponse: jest.Mocked<Response>;
  let mockUsersService: jest.Mocked<UsersService>;

  beforeEach(async () => {
    mockAuthService = {
      login: jest.fn(),
      refreshTokens: jest.fn(),
      forgotPassword: jest.fn(),
    } as any;

    mockRefreshTokenService = {
      generateTokenPair: jest.fn(),
    } as any;

    mockResponse = {
      cookie: jest.fn(),
      clearCookie: jest.fn(),
      redirect: jest.fn(),
    } as any;

    mockUsersService = {
      findByEmail: jest
        .fn()
        .mockResolvedValue({ id: 1, email: 'test@example.com' }),
      update: jest.fn(),
      create: jest.fn(),
      findByProvider: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: RefreshTokenService,
          useValue: mockRefreshTokenService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should set cookies and return user data', async () => {
      const mockUser = {
        sub: '1',
        email: 'test@example.com',
        role: 'user',
        permissions: [],
      };
      const mockTokens = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };

      mockAuthService.login.mockResolvedValue(mockTokens);

      const req = { user: mockUser };
      await controller.login(req, mockResponse, {} as AuthenticateUserDto);

      expect(mockAuthService.login).toHaveBeenCalledWith(mockUser);
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'refreshToken',
        mockTokens.refreshToken,
        cookieConstants.refresh,
      );
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'accessToken',
        mockTokens.accessToken,
        cookieConstants.access,
      );
    });
  });

  describe('refresh', () => {
    it('should set new cookies and return user data', async () => {
      const mockUser = {
        sub: '1',
        email: 'test@example.com',
        role: 'user',
        permissions: [],
      };
      const mockTokens = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };

      mockAuthService.refreshTokens.mockResolvedValue(mockTokens);

      const req = {
        user: mockUser,
        cookies: { refreshToken: 'old-refresh-token' },
      };
      const result = await controller.refresh(req, mockResponse);

      expect(mockAuthService.refreshTokens).toHaveBeenCalledWith(
        mockUser,
        'old-refresh-token',
      );
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'refreshToken',
        mockTokens.refreshToken,
        cookieConstants.refresh,
      );
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'accessToken',
        mockTokens.accessToken,
        cookieConstants.access,
      );
      expect(result).toEqual(mockUser);
    });
  });

  describe('logout', () => {
    it('should clear cookies', async () => {
      await controller.logout(mockResponse);

      expect(mockResponse.clearCookie).toHaveBeenCalledWith('refreshToken', {
        path: cookieConstants.refresh.path,
      });
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('accessToken', {
        path: cookieConstants.access.path,
      });
    });
  });

  describe('googleAuth', () => {
    it('should be callable and return undefined', async () => {
      await expect(controller.googleAuth()).resolves.toBeUndefined();
    });
  });

  describe('googleAuthCallback', () => {
    it('should set cookies and redirect to dashboard', async () => {
      const mockUser = {
        sub: '1',
        email: 'test@example.com',
        role: 'user',
        permissions: [],
      };
      const mockTokens = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };

      mockRefreshTokenService.generateTokenPair.mockResolvedValue(mockTokens);

      const req = {
        user: mockUser,
        cookies: { refreshToken: 'old-refresh-token' },
      };
      await controller.googleAuthCallback(req, mockResponse);

      expect(mockRefreshTokenService.generateTokenPair).toHaveBeenCalledWith(
        mockUser.sub,
        mockUser,
        'old-refresh-token',
      );
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'refreshToken',
        mockTokens.refreshToken,
        cookieConstants.refresh,
      );
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'accessToken',
        mockTokens.accessToken,
        cookieConstants.access,
      );
      expect(mockResponse.redirect).toHaveBeenCalledWith(
        `${process.env.APP_URL}/dashboard`,
      );
    });
  });

  describe('forgotPassword', () => {
    it('should store code in session and return nothing', async () => {
      const mockCode = 123456;
      const mockEmail = 'test@example.com';
      const mockSession: ISession = {};

      mockAuthService.forgotPassword.mockResolvedValue(mockCode);

      const req = { session: mockSession };
      await controller.forgotPassword(
        { email: mockEmail } as ForgotPasswordDto,
        req,
      );

      expect(mockAuthService.forgotPassword).toHaveBeenCalledWith(mockEmail);
      expect(mockSession.forgotPasswordEmail).toBe(mockEmail);
      expect(mockSession.forgotPasswordCode).toBe(mockCode);
    });
  });

  describe('verifyPasswordCode', () => {
    it('should throw GoneException if code is expired', async () => {
      const mockSession: ISession = {};

      await expect(
        controller.verifyPasswordCode(
          { code: '123456' } as VerifyPasswordCodeDto,
          mockSession,
        ),
      ).rejects.toThrow(GoneException);
    });

    it('should throw NotFoundException if email is not found', async () => {
      const mockSession: ISession = { forgotPasswordCode: '123456' };

      await expect(
        controller.verifyPasswordCode(
          { code: '123456' } as VerifyPasswordCodeDto,
          mockSession,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw UnauthorizedException if code is invalid', async () => {
      const mockSession: ISession = {
        forgotPasswordCode: '123456',
        forgotPasswordEmail: 'test@example.com',
      };

      await expect(
        controller.verifyPasswordCode(
          { code: '654321' } as VerifyPasswordCodeDto,
          mockSession,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return nothing if code is valid', async () => {
      const mockSession: ISession = {
        forgotPasswordCode: '123456',
        forgotPasswordEmail: 'test@example.com',
      };

      await expect(
        controller.verifyPasswordCode(
          { code: '123456' } as VerifyPasswordCodeDto,
          mockSession,
        ),
      ).resolves.toBeUndefined();
    });
  });

  describe('resetPassword', () => {
    it('should throw GoneException if code is expired', async () => {
      const mockSession: ISession = {};

      await expect(
        controller.resetPassword(
          {
            code: '123456',
            email: 'test@example.com',
            password: 'new-password',
          } as ResetPasswordDto,
          mockSession,
        ),
      ).rejects.toThrow(GoneException);
    });

    it('should throw NotFoundException if email is not found', async () => {
      const mockSession: ISession = { forgotPasswordCode: '123456' };

      await expect(
        controller.resetPassword(
          {
            code: '123456',
            email: 'test@example.com',
            password: 'new-password',
          } as ResetPasswordDto,
          mockSession,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw UnauthorizedException if code is invalid', async () => {
      const mockSession: ISession = {
        forgotPasswordCode: '123456',
        forgotPasswordEmail: 'test@example.com',
      };

      await expect(
        controller.resetPassword(
          {
            code: '654321',
            email: 'test@example.com',
            password: 'new-password',
          } as ResetPasswordDto,
          mockSession,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw NotFoundException if user is not found', async () => {
      const mockSession: ISession = {
        forgotPasswordCode: '123456',
        forgotPasswordEmail: 'test@example.com',
      };

      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(
        controller.resetPassword(
          {
            code: '123456',
            email: 'test@example.com',
            password: 'new-password',
          } as ResetPasswordDto,
          mockSession,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should reset password and clear session', async () => {
      const mockSession: ISession = {
        forgotPasswordCode: '123456',
        forgotPasswordEmail: 'test@example.com',
      };

      mockAuthService.forgotPassword.mockResolvedValue(123456);
      mockAuthService.refreshTokens.mockResolvedValue({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });

      await controller.resetPassword(
        {
          code: '123456',
          email: 'test@example.com',
          password: 'new-password',
        } as ResetPasswordDto,
        mockSession,
      );

      expect(controller['usersService'].findByEmail).toHaveBeenCalledWith(
        'test@example.com',
      );
      expect(controller['usersService'].update).toHaveBeenCalledWith(1, {
        password: 'new-password',
      });
      expect(mockSession.forgotPasswordEmail).toBeNull();
      expect(mockSession.forgotPasswordCode).toBeNull();
    });
  });
});
