import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';

import { SseService } from './sse.service';

describe('SseService', () => {
  let service: SseService;
  let mockEventEmitter: Partial<EventEmitter2>;

  beforeEach(async () => {
    mockEventEmitter = {
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SseService,
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<SseService>(SseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should emit event with correct name and data', () => {
    const eventName = 'test.event';
    const data = { foo: 'bar' };
    service.emitEvent(eventName, data);
    expect(mockEventEmitter.emit).toHaveBeenCalledWith(eventName, data);
  });
});
