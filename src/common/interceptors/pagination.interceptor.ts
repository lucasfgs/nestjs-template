import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { IPaginationResponse } from './interfaces/pagination.interface';

@Injectable()
export class PaginationInterceptor<T>
  implements NestInterceptor<T, IPaginationResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<IPaginationResponse<T>> {
    const request = context.switchToHttp().getRequest();
    const { page = 1, limit = 10, sortBy, sortOrder } = request.query;
    const currentPage = Number(page);
    const currentLimit = Number(limit);

    return next.handle().pipe(
      map((data: { items: T[]; total: number }) => {
        const totalPages = Math.ceil(data.total / currentLimit);
        const baseUrl = this.getBaseUrl(request);

        return {
          data: data.items,
          meta: {
            total: data.total,
            page: currentPage,
            limit: currentLimit,
            totalPages,
          },
          links: {
            first: this.buildUrl(baseUrl, 1, currentLimit, sortBy, sortOrder),
            last: this.buildUrl(
              baseUrl,
              totalPages,
              currentLimit,
              sortBy,
              sortOrder,
            ),
            next:
              currentPage < totalPages
                ? this.buildUrl(
                    baseUrl,
                    currentPage + 1,
                    currentLimit,
                    sortBy,
                    sortOrder,
                  )
                : null,
            previous:
              currentPage > 1
                ? this.buildUrl(
                    baseUrl,
                    currentPage - 1,
                    currentLimit,
                    sortBy,
                    sortOrder,
                  )
                : null,
          },
        };
      }),
    );
  }

  private getBaseUrl(request: any): string {
    const protocol = request.protocol;
    const host = request.get('host');
    const originalUrl = request.originalUrl.split('?')[0];
    return `${protocol}://${host}${originalUrl}`;
  }

  private buildUrl(
    baseUrl: string,
    page: number,
    limit: number,
    sortBy?: string,
    sortOrder?: string,
  ): string {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    if (sortBy) {
      params.append('sortBy', sortBy);
    }
    if (sortOrder) {
      params.append('sortOrder', sortOrder);
    }

    return `${baseUrl}?${params.toString()}`;
  }
}
