import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Response } from 'express';
import { STATUS_CODES } from 'node:http';

interface ErrorBody {
  statusCode: number;
  message: string | string[];
  error: string;
}

const reason = (status: number): string => STATUS_CODES[status] ?? 'Error';

/**
 * Normalises every error into a consistent shape:
 *   { statusCode, message, error }
 *
 * Also maps Prisma known-request errors (e.g. unique-constraint P2002) to
 * appropriate HTTP statuses instead of leaking 500s.
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const body = this.toBody(exception);
    // Log 5xx (server errors) with a stack trace; client errors are expected.
    if (body.statusCode >= 500) {
      this.logger.error(exception);
    }
    response.status(body.statusCode).json(body);
  }

  private toBody(exception: unknown): ErrorBody {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        return { statusCode: status, message: res, error: reason(status) };
      }
      const r = res as Record<string, unknown>;
      return {
        statusCode: status,
        message: (r.message as string | string[]) ?? exception.message,
        error: (r.error as string) ?? reason(status),
      };
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return this.fromPrisma(exception);
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      error: 'Internal Server Error',
    };
  }

  private fromPrisma(
    exception: Prisma.PrismaClientKnownRequestError,
  ): ErrorBody {
    if (exception.code === 'P2002') {
      const target = exception.meta?.target;
      const fields = Array.isArray(target)
        ? target.join(', ')
        : typeof target === 'string'
          ? target
          : '';
      const message = fields.includes('invoice_number')
        ? 'Invoice number already exists'
        : `A record with this ${fields || 'value'} already exists`;
      return { statusCode: HttpStatus.CONFLICT, message, error: 'Conflict' };
    }
    if (exception.code === 'P2025') {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Resource not found',
        error: 'Not Found',
      };
    }
    return {
      statusCode: HttpStatus.BAD_REQUEST,
      message: 'Database request error',
      error: 'Bad Request',
    };
  }
}
