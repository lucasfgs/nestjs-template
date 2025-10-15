import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  UseInterceptors,
} from '@nestjs/common';
import { ClassConstructor, plainToInstance } from 'class-transformer';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Generic serialization interceptor that transforms response data using class-transformer
 * This prevents sensitive data from being exposed in API responses and ensures proper DTO serialization
 *
 * Works in harmony with the global TransformInterceptor that wraps responses in { data: ... }
 * The serialization happens before the global transform, so we serialize the actual data
 * and let the global interceptor handle the wrapping
 */
@Injectable()
export class SerializeInterceptor<T> implements NestInterceptor {
  constructor(private dto: ClassConstructor<T>) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((response: any) => {
        return this.serializeData(response);
      }),
    );
  }

  private serializeData(data: any): any {
    if (!data) {
      return data;
    }

    // Handle responses that already have a 'data' property (from pagination interceptor)
    // These won't be wrapped again by the global TransformInterceptor
    if (typeof data === 'object' && 'data' in data) {
      return {
        data: this.serializeData(data.data), // Recursively serialize the nested data
        ...(data.meta && { meta: data.meta }), // Preserve meta if it exists
        ...(data.links && { links: data.links }), // Preserve links if it exists
      };
    }

    // Handle pagination responses from PaginationInterceptor
    if (
      data &&
      typeof data === 'object' &&
      'items' in data &&
      'total' in data
    ) {
      try {
        const processedItems = data.items.map((item: any) =>
          this.preprocessDecimalFields(item),
        );
        return {
          ...data,
          items: plainToInstance(this.dto, processedItems, {
            excludeExtraneousValues: false,
            enableImplicitConversion: false,
          }),
        };
      } catch (error) {
        // Return raw data if transformation fails to prevent 500 errors
        return data;
      }
    }

    // Handle array responses
    if (Array.isArray(data)) {
      try {
        const processedData = data.map((item) =>
          this.preprocessDecimalFields(item),
        );
        return plainToInstance(this.dto, processedData, {
          excludeExtraneousValues: false,
          enableImplicitConversion: false,
        });
      } catch (error) {
        // Return raw data if transformation fails to prevent 500 errors
        return data;
      }
    }

    // Handle single object responses
    if (typeof data === 'object') {
      try {
        // Pre-process the data to handle undefined/null Decimal fields
        const processedData = this.preprocessDecimalFields(data);
        return plainToInstance(this.dto, processedData, {
          excludeExtraneousValues: false,
          enableImplicitConversion: false,
        });
      } catch (error) {
        // Return raw data if transformation fails to prevent 500 errors
        return data;
      }
    }

    // Return primitive values as-is
    return data;
  }

  /**
   * Pre-process data to handle undefined/null Decimal fields
   * This prevents class-transformer from trying to convert undefined values to Decimal objects
   */
  private preprocessDecimalFields(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    // Handle arrays
    if (Array.isArray(data)) {
      return data.map((item) => this.preprocessDecimalFields(item));
    }

    // Create a copy of the data
    const processed = { ...data };

    // Process all fields to detect Decimal objects
    for (const key in processed) {
      // Skip prototype properties and non-enumerable properties
      if (!processed.hasOwnProperty(key)) {
        continue;
      }

      const value = processed[key];

      // Skip processing if the field is null/undefined
      if (value === undefined || value === null) {
        continue;
      }

      // Preserve Date objects as-is to avoid spreading them into empty objects
      if (value instanceof Date) {
        processed[key] = value;
        continue;
      }

      // Check if this is a Decimal object (using the same logic as transform interceptor)
      if (
        typeof (value as any)?.isDecimal === 'function' ||
        (value as any)?.constructor?.name === 'Decimal' ||
        (value as any)?._isDecimal
      ) {
        // Convert Decimal object to string
        processed[key] = (value as any).toString();
        continue;
      }
      // Additional check for Decimal.js objects that have specific structure
      if (
        value &&
        typeof value === 'object' &&
        typeof (value as any).s === 'number' &&
        typeof (value as any).e === 'number' &&
        Array.isArray((value as any).d) &&
        typeof (value as any).toString === 'function'
      ) {
        processed[key] = (value as any).toString();
        continue;
      }

      // Handle BigInt values
      if (typeof value === 'bigint') {
        processed[key] = value.toString();
        continue;
      }

      // Recursively process nested objects and arrays
      if (typeof value === 'object') {
        processed[key] = this.preprocessDecimalFields(value);
      }
    }

    return processed;
  }
}

/**
 * Decorator to easily apply serialization to controller methods
 * @param dto - The DTO class to serialize the response to
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export function Serialize<T>(dto: ClassConstructor<T>) {
  return UseInterceptors(new SerializeInterceptor(dto));
}
