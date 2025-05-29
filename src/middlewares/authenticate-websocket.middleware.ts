import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';

import { IAuthenticatedUser } from '@modules/api/core/auth/dto/authenticate-user.dto';
import { JwtStrategy } from '@modules/api/core/auth/strategies/jwt.strategy';

type SocketMiddleware = (socket: Socket, next: (err?: Error) => void) => void;

export const AuthenticateWebsocketMiddleware = (
  jwtService: JwtService,
): SocketMiddleware => {
  return async (socket: Socket, next) => {
    try {
      const cookies = (socket.request as any).cookies as Record<string, string>;

      const token = cookies['accessToken'];

      if (!token) throw new Error('No access token');

      if (!token) {
        throw new Error('Authorization token is missing');
      }

      let payload: IAuthenticatedUser | null = null;

      try {
        payload = await jwtService.verifyAsync<IAuthenticatedUser>(token, {
          secret: process.env.JWT_ACCESS_SECRET,
        });
      } catch (error) {
        throw new Error('Authorization token is invalid');
      }

      const strategy = new JwtStrategy();
      const user = await strategy.validate(payload);

      if (!user) {
        throw new Error('User does not exist');
      }

      socket = Object.assign(socket, {
        user,
      });
      next();
    } catch (error) {
      next(new Error('Unauthorized'));
    }
  };
};
