import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';

import { IAuthenticatedUser } from '@modules/api/core/auth/dto/authenticate-user.dto';
import { JwtStrategy } from '@modules/api/core/auth/strategies/jwt.strategy';

interface IAuthenticatedSocket extends Socket {
  user?: IAuthenticatedUser;
}

type SocketMiddleware = (
  socket: IAuthenticatedSocket,
  next: (err?: Error) => void,
) => void;

export const AuthenticateWebsocketMiddleware = (
  jwtService: JwtService,
): SocketMiddleware => {
  return async (socket: IAuthenticatedSocket, next) => {
    try {
      const cookies = (socket.request as any).cookies as Record<string, string>;

      const token = cookies['accessToken'];

      if (!token) throw new Error('No access token');

      let payload: IAuthenticatedUser | null = null;

      try {
        payload = await jwtService.verifyAsync<IAuthenticatedUser>(token, {
          secret: process.env.JWT_ACCESS_SECRET,
        });
      } catch {
        throw new Error('Authorization token is invalid');
      }

      const strategy = new JwtStrategy();
      const user = await strategy.validate(payload);

      if (!user) {
        throw new Error('User does not exist');
      }

      socket.user = user;
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  };
};
