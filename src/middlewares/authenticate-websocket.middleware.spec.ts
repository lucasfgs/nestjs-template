import { AuthenticateWebsocketMiddleware } from './authenticate-websocket.middleware';

describe('AuthenticateWebsocketMiddleware', () => {
  it('should be defined', () => {
    expect(new AuthenticateWebsocketMiddleware()).toBeDefined();
  });
});
