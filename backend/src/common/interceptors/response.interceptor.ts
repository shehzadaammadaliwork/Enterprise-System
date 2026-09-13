import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  StreamableFile,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';

function isPaginatedResult(
  value: unknown,
): value is { items: unknown[]; meta: unknown } {
  return (
    !!value &&
    typeof value === 'object' &&
    Array.isArray((value as Record<string, unknown>).items) &&
    typeof (value as Record<string, unknown>).meta === 'object'
  );
}

/// Wraps every controller return value into the shared success envelope:
/// { success: true, data, meta }. Services that back a list endpoint return
/// a `{ items, meta }` shape (see pagination.dto.ts); everything else is
/// passed through as `data` with no `meta`. StreamableFile (file downloads,
/// Module 13) is passed through untouched — JSON-wrapping a binary stream
/// would corrupt the response.
@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    return next.handle().pipe(
      map((value) => {
        if (value instanceof StreamableFile) return value;
        if (isPaginatedResult(value)) {
          return { success: true, data: value.items, meta: value.meta };
        }
        return { success: true, data: value ?? null };
      }),
    );
  }
}
