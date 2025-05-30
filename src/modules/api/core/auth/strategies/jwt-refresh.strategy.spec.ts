import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ExtractJwt } from 'passport-jwt';

import { UsersService } from '../../users/users.service';
import { IAuthenticatedUser } from '../dto/authenticate-user.dto';
import { RefreshTokenService } from '../refresh-token.service';

import { JwtRefreshStrategy } from './jwt-refresh.strategy';

// Patch PassportStrategy to just return the class passed to it
jest.mock('@nestjs/passport', () => ({
  PassportStrategy: (base: any) => base,
}));

jest.mock('passport-jwt', () => ({
  ExtractJwt: {
    fromExtractors: jest.fn((extractors) => ({
      _chain: extractors,
    })),
  },
  Strategy: class {
    _jwtFromRequest: any;
    _config: any;
    constructor(config: any) {
      this._jwtFromRequest = {
        _chain: [(req: any) => req?.cookies?.refreshToken],
      };
      this._config = config;
    }
  },
}));

describe('JwtRefreshStrategy', () => {
  let strategy: JwtRefreshStrategy;
  let refreshTokenService: jest.Mocked<RefreshTokenService>;
  let usersService: jest.Mocked<UsersService>;

  const mockUser: IAuthenticatedUser = {
    sub: '1',
    email: 'test@example.com',
    role: 'user',
    permissions: [],
  };

  const mockStoredUser = {
    id: 1,
    email: 'test@example.com',
    role: {
      name: 'user',
      permissionRole: [
        {
          permission: {
            name: 'users',
          },
          create: true,
          read: true,
          update: false,
          delete: false,
        },
      ],
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtRefreshStrategy,
        {
          provide: RefreshTokenService,
          useValue: {
            findTokenRecord: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    strategy = module.get<JwtRefreshStrategy>(JwtRefreshStrategy);
    refreshTokenService = module.get(RefreshTokenService);
    usersService = module.get(UsersService);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  it('should extract refresh token from cookies using extractor', () => {
    const extractors = (strategy as any)._jwtFromRequest._chain;
    const mockReqWithToken = { cookies: { refreshToken: 'refresh-token' } };
    const mockReqWithoutToken = { cookies: {} };
    expect(extractors[0](mockReqWithToken)).toBe('refresh-token');
    expect(extractors[0](mockReqWithoutToken)).toBeUndefined();
  });

  describe('validate', () => {
    it('should throw UnauthorizedException when no refresh token is provided', async () => {
      const req = {
        cookies: {},
      };

      await expect(strategy.validate(req, mockUser)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when refresh token is not found in whitelist', async () => {
      const req = {
        cookies: {
          refreshToken: 'invalid-token',
        },
      };

      refreshTokenService.findTokenRecord.mockResolvedValue(null);

      await expect(strategy.validate(req, mockUser)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(refreshTokenService.findTokenRecord).toHaveBeenCalledWith(
        'invalid-token',
        mockUser.sub,
      );
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      const req = {
        cookies: {
          refreshToken: 'valid-token',
        },
      };

      refreshTokenService.findTokenRecord.mockResolvedValue({
        id: '1',
        token: 'valid-token',
        userId: mockUser.sub,
        expiresAt: new Date(Date.now() + 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      usersService.findOne.mockResolvedValue(null);

      await expect(strategy.validate(req, mockUser)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(usersService.findOne).toHaveBeenCalledWith(mockUser.sub, {
        returnPermissions: true,
      });
    });

    it('should return normalized user data when validation succeeds', async () => {
      const req = {
        cookies: {
          refreshToken: 'valid-token',
        },
      };

      refreshTokenService.findTokenRecord.mockResolvedValue({
        id: '1',
        token: 'valid-token',
        userId: mockUser.sub,
        expiresAt: new Date(Date.now() + 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      usersService.findOne.mockResolvedValue(mockStoredUser as any);

      const result = await strategy.validate(req, mockUser);

      expect(result).toEqual({
        sub: mockStoredUser.id,
        email: mockStoredUser.email,
        role: mockStoredUser.role.name,
        permissions: [
          {
            name: 'users',
            create: true,
            read: true,
            update: false,
            delete: false,
          },
        ],
      });
    });

    it('should throw UnauthorizedException when token is not found in whitelist', async () => {
      const req = {
        cookies: {
          refreshToken: 'valid-token',
        },
      };

      refreshTokenService.findTokenRecord.mockResolvedValue(null);

      await expect(strategy.validate(req, mockUser)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(refreshTokenService.findTokenRecord).toHaveBeenCalledWith(
        'valid-token',
        mockUser.sub,
      );
    });
  });

  it('should set up extractor and config in constructor', () => {
    const refreshTokenService = { findTokenRecord: jest.fn() } as any;
    const usersService = { findOne: jest.fn() } as any;
    const instance = new JwtRefreshStrategy(refreshTokenService, usersService);
    expect(instance).toBeInstanceOf(JwtRefreshStrategy);
    // Check extractor is set up
    const extractors = (instance as any)._jwtFromRequest._chain;
    expect(typeof extractors[0]).toBe('function');
  });

  it('should call ExtractJwt.fromExtractors with correct extractor in constructor', () => {
    const refreshTokenService = { findTokenRecord: jest.fn() } as any;
    const usersService = { findOne: jest.fn() } as any;
    const spy = jest.spyOn(ExtractJwt, 'fromExtractors');
    new JwtRefreshStrategy(refreshTokenService, usersService);
    expect(spy).toHaveBeenCalledWith([expect.any(Function)]);
    // Check extractor returns the refreshToken from cookies
    const extractor = spy.mock.calls[0][0][0];
    expect(extractor({ cookies: { refreshToken: 'abc' } })).toBe('abc');
  });
});
