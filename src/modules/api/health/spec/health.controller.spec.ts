import { HttpModule } from '@nestjs/axios';
import {
  TerminusModule,
  HttpHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
  HealthCheckService,
} from '@nestjs/terminus';
import { Test, TestingModule } from '@nestjs/testing';

import { HealthController } from '../health.controller';

describe('HealthController', () => {
  let controller: HealthController;
  let httpHealthIndicator: any;
  let memoryHealthIndicator: any;
  let diskHealthIndicator: any;
  let healthCheckService: HealthCheckService;

  beforeEach(async () => {
    httpHealthIndicator = {
      pingCheck: jest.fn().mockResolvedValue({ status: 'up' }),
    };
    memoryHealthIndicator = {
      checkHeap: jest.fn().mockResolvedValue({ status: 'up' }),
    };
    diskHealthIndicator = {
      checkStorage: jest.fn().mockResolvedValue({ status: 'up' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [TerminusModule, HttpModule],
      controllers: [HealthController],
      providers: [
        { provide: HttpHealthIndicator, useValue: httpHealthIndicator },
        { provide: MemoryHealthIndicator, useValue: memoryHealthIndicator },
        { provide: DiskHealthIndicator, useValue: diskHealthIndicator },
      ],
    })
      .overrideProvider('TERMINUS_MODULE_OPTIONS')
      .useValue({
        logger: false,
      })
      .compile();

    controller = module.get<HealthController>(HealthController);
    healthCheckService = module.get<HealthCheckService>(HealthCheckService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('check', () => {
    it('should return health check results', async () => {
      // Mock HealthCheckService.check only for this test
      jest.spyOn(healthCheckService, 'check').mockResolvedValue({
        status: 'ok',
        info: {},
        details: {
          'nestjs-docs': { status: 'up' },
          memory_heap: { status: 'up' },
          storage: { status: 'up' },
        },
      });
      const result = await controller.check();

      expect(result).toBeDefined();
      expect(result.status).toBe('ok');
      expect(result.info).toBeDefined();
      expect(result.details).toBeDefined();

      // Check specific health indicators
      expect(result.details['nestjs-docs']).toBeDefined();
      expect(result.details['memory_heap']).toBeDefined();
      expect(result.details['storage']).toBeDefined();
    });

    it('should include memory heap check', async () => {
      await controller.check();
      expect(memoryHealthIndicator.checkHeap).toHaveBeenCalledWith(
        'memory_heap',
        150 * 1024 * 1024,
      );
    });

    it('should include storage check', async () => {
      await controller.check();
      expect(diskHealthIndicator.checkStorage).toHaveBeenCalledWith('storage', {
        path: '/',
        threshold: 250 * 1024 * 1024 * 1024,
      });
    });

    it('should include HTTP ping check', async () => {
      await controller.check();
      expect(httpHealthIndicator.pingCheck).toHaveBeenCalledWith(
        'nestjs-docs',
        'https://docs.nestjs.com',
      );
    });
  });
});
