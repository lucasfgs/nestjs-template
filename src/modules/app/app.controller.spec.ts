import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { Observable, Subject } from 'rxjs';

import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;
  let mockEventEmitter: Partial<EventEmitter2>;
  let eventSubject: Subject<any>;

  beforeEach(async () => {
    eventSubject = new Subject();
    mockEventEmitter = {
      emit: jest.fn(),
      on: jest.fn().mockImplementation((event, callback) => {
        eventSubject.subscribe(callback);
        return () => eventSubject.unsubscribe();
      }),
      addListener: jest.fn().mockImplementation((event, callback) => {
        eventSubject.subscribe(callback);
        return () => eventSubject.unsubscribe();
      }),
      removeListener: jest.fn(),
      removeAllListeners: jest.fn(),
      setMaxListeners: jest.fn(),
      getMaxListeners: jest.fn(),
      listeners: jest.fn(),
      eventNames: jest.fn(),
      listenerCount: jest.fn(),
    };

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });

  describe('sse', () => {
    it('should return an Observable for SSE events', () => {
      const result = appController.sse();
      expect(result).toBeInstanceOf(Observable);
    });

    it('should emit events when data is received', (done) => {
      const testData = { test: 'data' };
      const result = appController.sse();

      result.subscribe((event) => {
        expect(event.data).toEqual(testData);
        done();
      });

      eventSubject.next(testData);
    });
  });
});
