import { Test, TestingModule } from '@nestjs/testing';
import { ExtractJwt } from 'passport-jwt';

import { JwtStrategy } from './jwt.strategy';

// Patch PassportStrategy to just return the class passed to it
jest.mock('@nestjs/passport', () => ({
  PassportStrategy: (base: any) => base,
}));

jest.mock('passport-jwt', () => ({
  ExtractJwt: {
    fromExtractors: jest.fn((extractors) => ({
      _chain: extractors,
    })),
    fromAuthHeaderAsBearerToken: jest.fn(() => (req: any) => {
      const authHeader = req.headers?.authorization;
      if (!authHeader) return undefined;
      return authHeader.split(' ')[1];
    }),
  },
  Strategy: class {
    _jwtFromRequest: any;
    _config: any;
    constructor(config: any) {
      this._jwtFromRequest = {
        _chain: [
          (req: any) => req?.cookies?.accessToken,
          (req: any) => {
            const authHeader = req.headers?.authorization;
            if (!authHeader) return undefined;
            return authHeader.split(' ')[1];
          },
        ],
      };
      this._config = config;
    }
  },
}));

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JwtStrategy],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  it('should extract token from cookies', () => {
    const mockRequest = {
      cookies: {
        accessToken: 'mock-token',
      },
    };
    const extractors = (strategy as any)._jwtFromRequest._chain;
    expect(extractors[0](mockRequest)).toBe('mock-token');
  });

  it('should return undefined when no token in cookies', () => {
    const mockRequest = {
      cookies: {},
    };
    const extractors = (strategy as any)._jwtFromRequest._chain;
    expect(extractors[0](mockRequest)).toBeUndefined();
  });

  it('should extract token from auth header', () => {
    const mockRequest = {
      headers: {
        authorization: 'Bearer mock-token',
      },
    };
    const extractors = (strategy as any)._jwtFromRequest._chain;
    expect(extractors[1](mockRequest)).toBe('mock-token');
  });

  it('should return undefined when no token in auth header', () => {
    const mockRequest = {
      headers: {},
    };
    const extractors = (strategy as any)._jwtFromRequest._chain;
    expect(extractors[1](mockRequest)).toBeUndefined();
  });

  it('should validate and return user payload', async () => {
    const mockPayload = {
      sub: '1',
      email: 'test@example.com',
      role: 'user',
      permissions: [],
    };

    const result = await strategy.validate(mockPayload);

    expect(result).toEqual(mockPayload);
  });

  it('should set up extractor and config in constructor', () => {
    const instance = new JwtStrategy();
    expect(instance).toBeInstanceOf(JwtStrategy);
    // Check extractor is set up
    const extractors = (instance as any)._jwtFromRequest._chain;
    expect(typeof extractors[0]).toBe('function');
    expect(typeof extractors[1]).toBe('function');
  });

  it('should call ExtractJwt.fromExtractors with correct extractors in constructor', () => {
    const spy = jest.spyOn(ExtractJwt, 'fromExtractors');
    new JwtStrategy();
    expect(spy).toHaveBeenCalledWith([
      expect.any(Function),
      expect.any(Function),
    ]);
    // Check first extractor returns the accessToken from cookies
    const extractor = spy.mock.calls[0][0][0];
    expect(extractor({ cookies: { accessToken: 'abc' } })).toBe('abc');
  });
});
