import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { AuthService } from '../auth.service';

import { LocalStrategy } from './local.strategy';

jest.mock('@utils/normalizePermissions', () => ({
  normalizePermissions: jest.fn(() => [
    {
      name: 'users',
      create: true,
      read: true,
      update: false,
      delete: false,
    },
  ]),
}));

describe('LocalStrategy', () => {
  let strategy: LocalStrategy;
  let authService: jest.Mocked<AuthService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocalStrategy,
        {
          provide: AuthService,
          useValue: {
            validateUser: jest.fn(),
          },
        },
      ],
    }).compile();
    strategy = module.get<LocalStrategy>(LocalStrategy);
    authService = module.get(AuthService);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should return normalized user if credentials are valid', async () => {
      const user = {
        id: '1',
        email: 'test@example.com',
        role: { name: 'user' },
      };
      (authService.validateUser as jest.Mock).mockResolvedValue(user);
      const result = await strategy.validate('test@example.com', 'password');
      expect(authService.validateUser).toHaveBeenCalledWith(
        'test@example.com',
        'password',
      );
      expect(result).toEqual({
        sub: user.id,
        email: user.email,
        role: user.role.name,
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

    it('should throw UnauthorizedException if user is not found', async () => {
      (authService.validateUser as jest.Mock).mockResolvedValue(null);
      await expect(
        strategy.validate('test@example.com', 'wrong'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
