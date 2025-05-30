import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { Server, Socket } from 'socket.io';

import { EventsGateway } from '../events.gateway';

describe('EventsGateway', () => {
  let gateway: EventsGateway;
  let mockServer: Partial<Server>;
  let mockSocket: Partial<Socket>;
  let mockJwtService: Partial<JwtService>;
  let loggerLogSpy: jest.SpyInstance;
  let loggerDebugSpy: jest.SpyInstance;

  beforeEach(async () => {
    mockJwtService = {};
    mockServer = {
      use: jest.fn(),
      sockets: {
        size: 1,
      },
    } as any;
    mockSocket = {
      id: 'socket-1',
      emit: jest.fn(),
    } as any;

    loggerLogSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    loggerDebugSpy = jest.spyOn(Logger.prototype, 'debug').mockImplementation();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsGateway,
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    gateway = module.get<EventsGateway>(EventsGateway);
    gateway.io = mockServer as Server;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  it('should log and use AuthenticateWebsocketMiddleware on afterInit', () => {
    gateway.afterInit(mockServer as Server);
    expect(loggerLogSpy).toHaveBeenCalledWith('Initialized');
    expect(mockServer.use).toHaveBeenCalled();
  });

  it('should emit connected message and log on handleConnection', () => {
    // Construct the mockServer with sockets.sockets before assigning
    const sockets = { size: 2 };
    gateway.io = { sockets: { sockets } } as any;
    gateway.handleConnection(mockSocket as Socket);
    expect(mockSocket.emit).toHaveBeenCalledWith('connected', {
      message: 'You are connected',
    });
    expect(loggerLogSpy).toHaveBeenCalledWith('Client id: socket-1 connected');
    expect(loggerDebugSpy).toHaveBeenCalledWith(
      'Number of connected clients: 2',
    );
  });

  it('should log on handleDisconnect', () => {
    gateway.handleDisconnect(mockSocket as Socket);
    expect(loggerLogSpy).toHaveBeenCalledWith(
      'Cliend id:socket-1 disconnected',
    );
  });

  it('should handle ping message and return pong', () => {
    const data = { foo: 'bar' };
    const result = gateway.handleMessage(mockSocket as Socket, data);
    expect(result).toEqual({ event: 'pong', data });
    expect(loggerLogSpy).toHaveBeenCalledWith(
      'Message received from client id: socket-1',
    );
    expect(loggerDebugSpy).toHaveBeenCalledWith('Payload: [object Object]');
  });
});
