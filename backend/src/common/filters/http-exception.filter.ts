import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';

interface ErrorBody {
  code: string;
  message: string;
}

const STATUS_CODE_FALLBACK: Record<number, string> = {
  400: 'VALIDATION_ERROR',
  401: 'UNAUTHENTICATED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  429: 'RATE_LIMITED',
  500: 'INTERNAL_ERROR',
};

/// Global filter: every thrown error (NestJS HttpException, AppException,
/// Prisma errors, or anything unexpected) is normalized into the Section 5
/// error envelope `{ success:false, error:{ code, message } }`.
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, error } = this.resolve(exception);

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} -> ${status}`,
        (exception as Error)?.stack,
      );
    }

    response.status(status).json({ success: false, error });
  }

  private resolve(exception: unknown): { status: number; error: ErrorBody } {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'object' && body !== null && 'code' in body) {
        const b = body as { code: string; message: string | string[] };
        return {
          status,
          error: { code: b.code, message: this.flattenMessage(b.message) },
        };
      }
      const message =
        typeof body === 'object' && body !== null && 'message' in body
          ? (body as { message: string | string[] }).message
          : exception.message;
      return {
        status,
        error: {
          code: STATUS_CODE_FALLBACK[status] ?? 'ERROR',
          message: this.flattenMessage(message),
        },
      };
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        return {
          status: HttpStatus.CONFLICT,
          error: {
            code: 'CONFLICT',
            message: 'A record with these unique fields already exists.',
          },
        };
      }
      if (exception.code === 'P2025') {
        return {
          status: HttpStatus.NOT_FOUND,
          error: { code: 'NOT_FOUND', message: 'Record not found.' },
        };
      }
    }

    // `csrf-csrf`'s CSRF-validation failure is a plain `http-errors` object
    // (status/code/message), not a NestJS HttpException.
    if (this.isHttpErrorsShape(exception)) {
      return {
        status: exception.status,
        error: {
          code:
            exception.code ?? STATUS_CODE_FALLBACK[exception.status] ?? 'ERROR',
          message: exception.message,
        },
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred.',
      },
    };
  }

  private flattenMessage(message: string | string[]): string {
    return Array.isArray(message) ? message.join('; ') : message;
  }

  private isHttpErrorsShape(
    exception: unknown,
  ): exception is { status: number; code?: string; message: string } {
    return (
      typeof exception === 'object' &&
      exception !== null &&
      typeof (exception as { status?: unknown }).status === 'number' &&
      typeof (exception as { message?: unknown }).message === 'string'
    );
  }
}
