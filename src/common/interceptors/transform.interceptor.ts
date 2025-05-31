import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface IResponse<T> {
  data: T;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, IResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<IResponse<T>> {
    return next.handle().pipe(
      map((response) => {
        // If the response already has a data property (like from pagination),
        // return it as is
        if (response && typeof response === 'object' && 'data' in response) {
          return response;
        }

        // Otherwise, wrap the response in a data property
        return {
          data: response,
        };
      }),
    );
  }
}
