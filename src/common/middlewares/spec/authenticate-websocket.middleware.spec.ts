import { IncomingMessage } from 'http';

import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { Socket } from 'socket.io';

import { IAuthenticatedUser } from '@modules/api/core/auth/dto/authenticate-user.dto';
import { JwtStrategy } from '@modules/api/core/auth/strategies/jwt.strategy';

import { AuthenticateWebsocketMiddleware } from '../authenticate-websocket.middleware';

interface IAuthenticatedSocket extends Socket {
  user?: IAuthenticatedUser;
  request: IncomingMessage & {
    cookies?: Record<string, string>;
  };
}

jest.mock('@modules/api/core/auth/strategies/jwt.strategy', () => {
  return {
    JwtStrategy: jest.fn().mockImplementation(() => ({
      validate: jest
        .fn()
        .mockImplementation((payload) => Promise.resolve(payload)),
    })),
  };
});

describe('AuthenticateWebsocketMiddleware', () => {
  let middleware: ReturnType<typeof AuthenticateWebsocketMiddleware>;
  let mockJwtService: jest.Mocked<Partial<JwtService>>;
  let mockSocket: Partial<IAuthenticatedSocket>;
  let mockNext: jest.Mock;

  beforeEach(async () => {
    mockJwtService = {
      verifyAsync: jest.fn(),
    };

    mockSocket = Object.assign(Object.create({}), {
      handshake: {
        auth: {
          access_token: 'mock_token',
        },
        headers: {},
        time: new Date().toISOString(),
        address: '127.0.0.1',
        xdomain: false,
        secure: false,
        issued: Date.now(),
        url: '/',
        query: {},
      },
      request: {
        cookies: {
          accessToken: 'mock_token',
        },
      } as any,
      user: undefined,
    });

    mockNext = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: AuthenticateWebsocketMiddleware,
          useFactory: (jwtService: JwtService) =>
            AuthenticateWebsocketMiddleware(jwtService),
          inject: [JwtService],
        },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    middleware = module.get<ReturnType<typeof AuthenticateWebsocketMiddleware>>(
      AuthenticateWebsocketMiddleware,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(middleware).toBeDefined();
  });

  describe('use', () => {
    it('should attach user to socket when token is valid', async () => {
      const mockUser: IAuthenticatedUser = {
        sub: '1',
        email: 'test@example.com',
        name: 'test',
        role: 'user',
        permissions: [],
      };
      mockJwtService.verifyAsync?.mockResolvedValue(mockUser);

      await middleware(mockSocket as IAuthenticatedSocket, mockNext);

      expect(mockSocket.user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should not attach user when no token is provided', async () => {
      mockSocket.request = {
        cookies: {},
      } as any;

      await middleware(mockSocket as IAuthenticatedSocket, mockNext);

      expect(mockSocket.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should not attach user when token is invalid', async () => {
      mockJwtService.verifyAsync?.mockRejectedValue(new Error('Invalid token'));

      await middleware(mockSocket as IAuthenticatedSocket, mockNext);

      expect(mockSocket.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should not attach user when request has no cookies', async () => {
      mockSocket.request = {} as any;

      await middleware(mockSocket as IAuthenticatedSocket, mockNext);

      expect(mockSocket.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should not attach user when validate returns null', async () => {
      const mockUser: IAuthenticatedUser = {
        sub: '1',
        email: 'test@example.com',
        name: 'test',
        role: 'user',
        permissions: [],
      };
      mockJwtService.verifyAsync?.mockResolvedValue(mockUser);

      (JwtStrategy as jest.Mock).mockImplementationOnce(() => ({
        validate: jest.fn().mockResolvedValue(null),
      }));

      await middleware(mockSocket as IAuthenticatedSocket, mockNext);

      expect(mockSocket.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle any error during authentication', async () => {
      mockSocket.request = null as any;

      await middleware(mockSocket as IAuthenticatedSocket, mockNext);

      expect(mockSocket.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle duplicate token check', async () => {
      mockSocket.request = {
        cookies: {
          accessToken: 'mock_token',
        },
      } as any;

      // Mock the first token check to pass
      mockJwtService.verifyAsync?.mockResolvedValueOnce({
        sub: '1',
        email: 'test@example.com',
        role: 'user',
        permissions: [],
      });

      await middleware(mockSocket as IAuthenticatedSocket, mockNext);

      expect(mockSocket.user).toBeDefined();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle missing access token in cookies', async () => {
      mockSocket.request = {
        cookies: {
          otherToken: 'mock_token',
        },
      } as any;

      await middleware(mockSocket as IAuthenticatedSocket, mockNext);

      expect(mockSocket.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle undefined request', async () => {
      mockSocket.request = undefined as any;

      await middleware(mockSocket as IAuthenticatedSocket, mockNext);

      expect(mockSocket.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle undefined cookies', async () => {
      mockSocket.request = {
        cookies: undefined,
      } as any;

      await middleware(mockSocket as IAuthenticatedSocket, mockNext);

      expect(mockSocket.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
