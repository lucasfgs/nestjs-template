import { Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { IAuthenticatedUser } from 'src/modules/api/auth/dto/authenticate-user.dto';
import { JwtStrategy } from 'src/modules/api/auth/strategies/jwt.strategy';
import { jwtConstants } from 'src/modules/api/auth/constants';

type SocketMiddleware = (socket: Socket, next: (err?: Error) => void) => void;

export const AuthenticateWebsocketMiddleware = (
  jwtService: JwtService,
): SocketMiddleware => {
  return async (socket: Socket, next) => {
    try {
      const token = socket.handshake?.auth?.token;

      if (!token) {
        throw new Error('Authorization token is missing');
      }

      let payload: IAuthenticatedUser | null = null;

      try {
        payload = await jwtService.verifyAsync<IAuthenticatedUser>(token, {
          secret: jwtConstants.secret,
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
