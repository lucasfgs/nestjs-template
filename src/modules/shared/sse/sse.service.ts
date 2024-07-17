import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class SseService {
  constructor(private eventEmitter: EventEmitter2) {}

  emitEvent<T>(eventName: string, data: T) {
    this.eventEmitter.emit(eventName, data);
  }
}
