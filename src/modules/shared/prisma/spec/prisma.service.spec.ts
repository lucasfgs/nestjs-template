import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient, Prisma } from '@prisma/client';

import { PrismaLoggerService } from '@modules/api/core/logging/prisma-logger.service';

import { PrismaService } from '../prisma.service';

describe('PrismaService', () => {
  let service: PrismaService;
  let prismaLogger: PrismaLoggerService;
  let $onSpy: jest.SpyInstance;
  let $connectSpy: jest.SpyInstance;
  let $disconnectSpy: jest.SpyInstance;

  beforeEach(async () => {
    // Spy on PrismaClient prototype methods
    $onSpy = jest
      .spyOn(PrismaClient.prototype, '$on')
      .mockImplementation(jest.fn());
    $connectSpy = jest
      .spyOn(PrismaClient.prototype, '$connect')
      .mockResolvedValue(undefined);
    $disconnectSpy = jest
      .spyOn(PrismaClient.prototype, '$disconnect')
      .mockResolvedValue(undefined);

    // Create mock PrismaLoggerService
    prismaLogger = {
      logQuery: jest.fn(),
      logError: jest.fn(),
      logInfo: jest.fn(),
      logWarn: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaService,
        { provide: PrismaLoggerService, useValue: prismaLogger },
      ],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should initialize PrismaClient with correct logging configuration', () => {
    // The constructor is called with the log config
    // We can't spy on the constructor directly, but we can check $on was called for all events
    expect($onSpy).toHaveBeenCalledWith('query', expect.any(Function));
    expect($onSpy).toHaveBeenCalledWith('error', expect.any(Function));
    expect($onSpy).toHaveBeenCalledWith('info', expect.any(Function));
    expect($onSpy).toHaveBeenCalledWith('warn', expect.any(Function));
  });

  it('should bind event handlers for query, error, info, and warn', () => {
    expect($onSpy).toHaveBeenCalledWith('query', expect.any(Function));
    expect($onSpy).toHaveBeenCalledWith('error', expect.any(Function));
    expect($onSpy).toHaveBeenCalledWith('info', expect.any(Function));
    expect($onSpy).toHaveBeenCalledWith('warn', expect.any(Function));
  });

  it('should call logger methods when events are emitted', () => {
    // Find the handlers
    const queryHandler = $onSpy.mock.calls.find(
      (call) => call[0] === 'query',
    )?.[1];
    const errorHandler = $onSpy.mock.calls.find(
      (call) => call[0] === 'error',
    )?.[1];
    const infoHandler = $onSpy.mock.calls.find(
      (call) => call[0] === 'info',
    )?.[1];
    const warnHandler = $onSpy.mock.calls.find(
      (call) => call[0] === 'warn',
    )?.[1];

    // Test query event
    const queryEvent = { query: 'SELECT * FROM users' } as Prisma.QueryEvent;
    queryHandler?.(queryEvent);
    expect(prismaLogger.logQuery).toHaveBeenCalledWith(queryEvent);

    // Test error event
    const errorEvent = { message: 'Database error' } as Prisma.LogEvent;
    errorHandler?.(errorEvent);
    expect(prismaLogger.logError).toHaveBeenCalledWith(errorEvent);

    // Test info event
    const infoEvent = { message: 'Info message' } as Prisma.LogEvent;
    infoHandler?.(infoEvent);
    expect(prismaLogger.logInfo).toHaveBeenCalledWith(infoEvent);

    // Test warn event
    const warnEvent = { message: 'Warning message' } as Prisma.LogEvent;
    warnHandler?.(warnEvent);
    expect(prismaLogger.logWarn).toHaveBeenCalledWith(warnEvent);
  });

  it('should call $connect on onModuleInit', async () => {
    await service.onModuleInit();
    expect($connectSpy).toHaveBeenCalled();
  });

  it('should call $disconnect on onModuleDestroy', async () => {
    await service.onModuleDestroy();
    expect($disconnectSpy).toHaveBeenCalled();
  });
});
