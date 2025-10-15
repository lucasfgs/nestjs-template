import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { SKIP_TRANSFORM_KEY } from '@common/decorators/SkipTransform.decorator';

import type { Decimal } from '@prisma/client/runtime/library';

export interface IResponse<T> {
  data: T;
  meta?: any;
}

type JsonLike =
  | string
  | number
  | boolean
  | null
  | bigint // will be normalized to string
  | Date // JSON.stringify already ISO-serializes
  | Buffer // will be base64
  | Decimal // will be string
  | Record<string, any>
  | Array<any>;

function normalize(value: JsonLike): any {
  if (value === null || value === undefined) return value;
  const t = typeof value;
  if (t === 'bigint') return value.toString(); // BigInt -> string
  if (t === 'string' || t === 'number' || t === 'boolean') return value;

  // Decimal (Prisma) -> string (duck-typing to avoid hard dep if unused)
  if (
    typeof (value as any)?.isDecimal === 'function' ||
    (value as any)?._isDecimal
  ) {
    return (value as Decimal).toString();
  }
  if (
    (value as any)?.constructor?.name === 'Decimal' &&
    typeof (value as any).toString === 'function'
  ) {
    return (value as any).toString();
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
    return (value as any).toString();
  }
  // Check if it's a Decimal object by looking for the constructor function
  if (
    value &&
    typeof value === 'object' &&
    (value as any).constructor &&
    typeof (value as any).constructor === 'function' &&
    (value as any).constructor.toString().includes('Decimal')
  ) {
    return parseFloat((value as any).toString()) || 0;
  }

  if (value instanceof Date) return value; // JSON.stringify handles it
  if (typeof Buffer !== 'undefined' && Buffer.isBuffer(value)) {
    return (value as Buffer).toString('base64');
  }

  if (Array.isArray(value)) return value.map(normalize);

  if (t === 'object') {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(value as Record<string, any>)) {
      out[k] = normalize(v as JsonLike);
    }
    return out;
  }
  return value;
}

function isAlreadyWrapped(obj: any): obj is IResponse<any> {
  return !!obj && typeof obj === 'object' && 'data' in obj;
}

function isPaginatedShape(obj: any): boolean {
  // keep shapes like { data: [...], meta: {...} } or { data: [...], pagination: {...} }
  if (!isAlreadyWrapped(obj)) return false;
  return 'meta' in obj || 'pagination' in obj;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, IResponse<T>>
{
  constructor(private readonly reflector: Reflector) {}

  intercept(
    ctx: ExecutionContext,
    next: CallHandler,
  ): Observable<IResponse<T>> {
    // If handler/class set SkipTransform metadata, bypass wrapping
    const handler = ctx.getHandler();
    const isSkipped = this.reflector.getAllAndOverride<boolean>(
      SKIP_TRANSFORM_KEY,
      [handler, ctx.getClass()],
    );
    return next.handle().pipe(
      map((response: any) => {
        if (isSkipped) return response;

        // 1) Normalize first to avoid BigInt serialization errors
        const normalized = normalize(response);

        // 2) Preserve already-wrapped/paginated responses
        if (isPaginatedShape(normalized)) {
          return normalized; // { data, meta|pagination, ... }
        }
        if (isAlreadyWrapped(normalized)) {
          return normalized; // { data } (already wrapped)
        }

        // 3) Wrap everything else
        return { data: normalized };
      }),
    );
  }
}
