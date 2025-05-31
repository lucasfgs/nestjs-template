import { INestApplicationContext } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import cookieParser from 'cookie-parser';
import { ServerOptions, Server, Socket } from 'socket.io';

export class CookieIoAdapter extends IoAdapter {
  constructor(app: INestApplicationContext) {
    super(app);
  }

  createIOServer(port: number, options?: ServerOptions): Server {
    const server = super.createIOServer(port, options);

    // Apply cookie-parser to every incoming handshake
    server.use((socket: Socket, next) => {
      // cookieParser() returns a middleware fn (req, res, next)
      // socket.request is the HTTP upgrade request
      // we can pass an empty object for res
      cookieParser()(socket.request as any, {} as any, next as any);
    });

    return server;
  }
}
