import { ALLOW_PERMISSIONS } from '@common/decorators/AllowPermissions';
import { IS_PUBLIC_KEY } from '@common/decorators/Public';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { Method } from 'axios';

import { EPermission } from '@modules/api/core/permissions/entities/permission.entity';

import { UsersService } from '../../users/users.service';
import { IAuthenticatedUser } from '../dto/authenticate-user.dto';

import { PermissionGuard } from './permission.guard';

describe('PermissionGuard', () => {
  let guard: PermissionGuard;
  let reflector: Reflector;
  let usersService: jest.Mocked<UsersService>;
  let mockContext: ExecutionContext;

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
        PermissionGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
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

    guard = module.get<PermissionGuard>(PermissionGuard);
    reflector = module.get<Reflector>(Reflector);
    usersService = module.get(UsersService);

    mockContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          user: mockUser,
          method: 'GET',
        }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as any;
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should allow access to public routes', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
        if (key === IS_PUBLIC_KEY) return true;
        return undefined;
      });

      const result = await guard.canActivate(mockContext);
      expect(result).toBe(true);
    });

    it('should allow access when no permissions are required', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
        if (key === IS_PUBLIC_KEY) return false;
        if (key === ALLOW_PERMISSIONS) return undefined;
        return undefined;
      });

      const result = await guard.canActivate(mockContext);
      expect(result).toBe(true);
    });

    it('should deny access when no user is present', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
        if (key === IS_PUBLIC_KEY) return false;
        if (key === ALLOW_PERMISSIONS) return [EPermission.USERS];
        return undefined;
      });

      mockContext.switchToHttp().getRequest().user = null;

      const result = await guard.canActivate(mockContext);
      expect(result).toBe(false);
    });

    it('should allow access when user has required permission', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
        if (key === IS_PUBLIC_KEY) return false;
        if (key === ALLOW_PERMISSIONS) return [EPermission.USERS];
        return undefined;
      });

      usersService.findOne.mockResolvedValue(mockStoredUser as any);

      const result = await guard.canActivate(mockContext);
      expect(result).toBe(true);
    });

    it('should deny access when user does not have required permission', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
        if (key === IS_PUBLIC_KEY) return false;
        if (key === ALLOW_PERMISSIONS) return [EPermission.ROLES];
        return undefined;
      });

      usersService.findOne.mockResolvedValue(mockStoredUser as any);

      const result = await guard.canActivate(mockContext);
      expect(result).toBe(false);
    });

    it('should handle different HTTP methods correctly', async () => {
      const methods: Method[] = ['POST', 'GET', 'PUT', 'PATCH', 'DELETE'];
      const mockStoredUserWithAllPermissions = {
        ...mockStoredUser,
        role: {
          permissionRole: [
            {
              permission: {
                name: 'users',
              },
              create: true,
              read: true,
              update: true,
              delete: true,
            },
          ],
        },
      };

      jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
        if (key === IS_PUBLIC_KEY) return false;
        if (key === ALLOW_PERMISSIONS) return [EPermission.USERS];
        return undefined;
      });

      usersService.findOne.mockResolvedValue(
        mockStoredUserWithAllPermissions as any,
      );

      for (const method of methods) {
        mockContext.switchToHttp().getRequest().method = method;
        const result = await guard.canActivate(mockContext);
        expect(result).toBe(true);
      }
    });
  });
});
