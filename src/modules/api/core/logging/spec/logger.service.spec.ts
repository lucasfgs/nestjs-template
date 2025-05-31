import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { LOG_LEVELS } from '@configs/logging.config';

import { LoggerService } from '../logger.service';

describe('LoggerService', () => {
  let service: LoggerService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoggerService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'NODE_ENV') return 'development';
              return undefined;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<LoggerService>(LoggerService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create logger with development configuration', () => {
    expect(configService.get).toHaveBeenCalledWith('NODE_ENV');
    const logger = (service as any).logger;
    expect(logger.level).toBe(LOG_LEVELS.DEBUG);
  });

  it('should create logger with production configuration', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoggerService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'NODE_ENV') return 'production';
              return undefined;
            }),
          },
        },
      ],
    }).compile();

    const prodService = module.get<LoggerService>(LoggerService);
    const logger = (prodService as any).logger;
    expect(logger.level).toBe(LOG_LEVELS.INFO);
  });

  it('should create logger with default configuration when NODE_ENV is not set', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoggerService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(() => undefined),
          },
        },
      ],
    }).compile();

    const defaultService = module.get<LoggerService>(LoggerService);
    const logger = (defaultService as any).logger;
    // Should default to INFO level
    expect(logger.level).toBe(LOG_LEVELS.INFO);
    // Should have at least one Console and one DailyRotateFile transport
    const transportNames = logger.transports.map((t) => t.constructor.name);
    expect(transportNames).toContain('Console');
    expect(transportNames).toContain('DailyRotateFile');
  });

  describe('logging methods', () => {
    let loggerSpy: jest.SpyInstance;

    beforeEach(() => {
      loggerSpy = jest.spyOn((service as any).logger, 'info');
    });

    afterEach(() => {
      loggerSpy.mockRestore();
    });

    it('should log info messages', () => {
      const message = 'test message';
      const context = 'test context';
      service.log(message, context);
      expect(loggerSpy).toHaveBeenCalledWith(message, { context });
    });

    it('should log error messages', () => {
      const errorSpy = jest.spyOn((service as any).logger, 'error');
      const message = 'error message';
      const trace = 'error trace';
      const context = 'error context';
      service.error(message, trace, context);
      expect(errorSpy).toHaveBeenCalledWith(message, { trace, context });
    });

    it('should log warning messages', () => {
      const warnSpy = jest.spyOn((service as any).logger, 'warn');
      const message = 'warning message';
      const context = 'warning context';
      service.warn(message, context);
      expect(warnSpy).toHaveBeenCalledWith(message, { context });
    });

    it('should log debug messages', () => {
      const debugSpy = jest.spyOn((service as any).logger, 'debug');
      const message = 'debug message';
      const context = 'debug context';
      service.debug(message, context);
      expect(debugSpy).toHaveBeenCalledWith(message, { context });
    });

    it('should log verbose messages', () => {
      const verboseSpy = jest.spyOn((service as any).logger, 'verbose');
      const message = 'verbose message';
      const context = 'verbose context';
      service.verbose(message, context);
      expect(verboseSpy).toHaveBeenCalledWith(message, { context });
    });
  });
});
