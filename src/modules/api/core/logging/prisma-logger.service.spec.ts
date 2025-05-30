import { LoggerService } from './logger.service';
import { PrismaLoggerService } from './prisma-logger.service';

describe('PrismaLoggerService', () => {
  let service: PrismaLoggerService;
  let logger: LoggerService;

  beforeEach(() => {
    logger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    } as any;
    service = new PrismaLoggerService(logger);
  });

  it('should log query except SELECT', () => {
    const queryEvent = {
      query: 'INSERT INTO users VALUES ($1)',
      params: '[1]',
      duration: 10,
    } as any;
    service.logQuery(queryEvent);
    expect(logger.log).toHaveBeenCalledWith(
      expect.stringContaining('Query: INSERT INTO users VALUES ($1)'),
      'Prisma',
    );
  });

  it('should not log SELECT queries', () => {
    const queryEvent = {
      query: 'SELECT * FROM users',
      params: '[1]',
      duration: 5,
    } as any;
    service.logQuery(queryEvent);
    expect(logger.log).not.toHaveBeenCalled();
  });

  it('should log error', () => {
    const errorEvent = {
      message: 'Some error',
      target: 'users',
    } as any;
    service.logError(errorEvent);
    expect(logger.error).toHaveBeenCalledWith(
      'Prisma Error: Some error',
      'users',
      'Prisma',
    );
  });

  it('should log info', () => {
    const infoEvent = {
      message: 'Info message',
    } as any;
    service.logInfo(infoEvent);
    expect(logger.log).toHaveBeenCalledWith(
      'Prisma Info: Info message',
      'Prisma',
    );
  });

  it('should log warning', () => {
    const warnEvent = {
      message: 'Warning message',
    } as any;
    service.logWarn(warnEvent);
    expect(logger.warn).toHaveBeenCalledWith(
      'Prisma Warning: Warning message',
      'Prisma',
    );
  });
});
