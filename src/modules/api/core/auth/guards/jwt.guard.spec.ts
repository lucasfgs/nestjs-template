import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';

import { IS_PUBLIC_KEY } from '@decorators/Public';

import { JwtAuthGuard } from './jwt.guard';

// Helper to get the parent prototype
const getParentPrototype = (instance: any) =>
  Object.getPrototypeOf(Object.getPrototypeOf(instance));

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;
  let mockContext: ExecutionContext;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
    reflector = module.get<Reflector>(Reflector);

    mockContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          user: { sub: '1', email: 'test@example.com' },
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

    it('should call super.canActivate for non-public routes', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
        if (key === IS_PUBLIC_KEY) return false;
        return undefined;
      });

      const parentProto = getParentPrototype(guard);
      const superCanActivate = jest
        .spyOn(parentProto, 'canActivate')
        .mockReturnValue(true);
      const result = guard.canActivate(mockContext);
      expect(superCanActivate).toHaveBeenCalledWith(mockContext);
      expect(result).toBe(true);
      superCanActivate.mockRestore();
    });

    it('should handle undefined public key', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
        if (key === IS_PUBLIC_KEY) return undefined;
        return undefined;
      });

      const parentProto = getParentPrototype(guard);
      const superCanActivate = jest
        .spyOn(parentProto, 'canActivate')
        .mockReturnValue(true);
      const result = guard.canActivate(mockContext);
      expect(superCanActivate).toHaveBeenCalledWith(mockContext);
      expect(result).toBe(true);
      superCanActivate.mockRestore();
    });

    it('should handle super.canActivate throwing an error', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
        if (key === IS_PUBLIC_KEY) return false;
        return undefined;
      });

      const error = new Error('Authentication failed');
      const parentProto = getParentPrototype(guard);
      jest.spyOn(parentProto, 'canActivate').mockImplementation(() => {
        throw error;
      });
      expect(() => guard.canActivate(mockContext)).toThrow(error);
    });
  });

  describe('handleRequest', () => {
    it('should return user if authentication is successful', () => {
      const user = { sub: '1', email: 'test@example.com' };
      const result = guard.handleRequest(null, user);
      expect(result).toEqual(user);
    });

    it('should throw the original error if there is an error', () => {
      const error = new Error('Authentication failed');
      expect(() => guard.handleRequest(error, null)).toThrow(error);
    });

    it('should throw UnauthorizedException if no user is present', () => {
      expect(() => guard.handleRequest(null, null)).toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if user is undefined', () => {
      expect(() => guard.handleRequest(null, undefined)).toThrow(
        UnauthorizedException,
      );
    });

    it('should throw the original error even if user is present', () => {
      const error = new Error('Authentication failed');
      const user = { sub: '1', email: 'test@example.com' };
      expect(() => guard.handleRequest(error, user)).toThrow(error);
    });
  });
});
