import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthenticateWebsocketMiddleware } from 'src/middlewares/authenticate-websocket.middleware';

@WebSocketGateway()
export class EventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(EventsGateway.name);

  constructor(private jwtService: JwtService) {}

  @WebSocketServer() io: Server;

  afterInit(server: Server) {
    this.logger.log('Initialized');
    server.use(AuthenticateWebsocketMiddleware(this.jwtService));
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handleConnection(client: Socket, ...args: any[]) {
    const { sockets } = this.io.sockets;

    client.emit('connected', {
      message: 'You are connected',
    });

    this.logger.log(`Client id: ${client.id} connected`);
    this.logger.debug(`Number of connected clients: ${sockets.size}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Cliend id:${client.id} disconnected`);
  }

  @SubscribeMessage('ping')
  handleMessage(client: Socket, data: any) {
    this.logger.log(`Message received from client id: ${client.id}`);
    this.logger.debug(`Payload: ${data}`);
    return {
      event: 'pong',
      data,
    };
  }
}
