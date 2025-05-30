import { Test, TestingModule } from '@nestjs/testing';
import { Provider } from '@prisma/client';
import { Profile } from 'passport-google-oauth20';

import { AuthService } from '../auth.service';

import { GoogleStrategy } from './google.strategy';

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

const mockUser = {
  id: '1',
  email: 'test@example.com',
  role: { name: 'user' },
};

describe('GoogleStrategy', () => {
  let strategy: GoogleStrategy;
  let authService: jest.Mocked<AuthService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoogleStrategy,
        {
          provide: AuthService,
          useValue: {
            validateOAuthLogin: jest.fn(),
          },
        },
      ],
    }).compile();

    strategy = module.get<GoogleStrategy>(GoogleStrategy);
    authService = module.get(AuthService);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should call authService.validateOAuthLogin and return normalized user', async () => {
      const profile: Profile = {
        id: 'google-id',
        displayName: 'Test User',
        emails: [{ value: 'test@example.com' }],
        provider: 'google',
        name: { familyName: '', givenName: '' },
        photos: [],
        _json: {},
        _raw: '',
      };
      (authService.validateOAuthLogin as jest.Mock).mockResolvedValue({
        ...mockUser,
        role: { name: 'user' },
      });

      const result = await strategy.validate('access', 'refresh', profile);

      expect(authService.validateOAuthLogin).toHaveBeenCalledWith({
        provider: Provider.GOOGLE,
        profileId: 'google-id',
        email: 'test@example.com',
        displayName: 'Test User',
        roleId: 3, // RoleEnum.GOOGLE
      });
      expect(result).toEqual({
        sub: mockUser.id,
        email: mockUser.email,
        role: 'user',
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
  });
});
