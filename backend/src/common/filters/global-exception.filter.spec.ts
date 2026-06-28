import {
  type ArgumentsHost,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { GlobalExceptionFilter } from './global-exception.filter';

function mockHost(): {
  host: ArgumentsHost;
  res: { status: jest.Mock; json: jest.Mock };
} {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  const host = {
    switchToHttp: () => ({ getResponse: () => res }),
  } as unknown as ArgumentsHost;
  return { host, res };
}

describe('GlobalExceptionFilter', () => {
  const filter = new GlobalExceptionFilter();

  it('maps a duplicate invoice number (Prisma P2002) to 409 Conflict', () => {
    const { host, res } = mockHost();
    const error = new Prisma.PrismaClientKnownRequestError(
      'Unique constraint failed',
      {
        code: 'P2002',
        clientVersion: '6.0.0',
        meta: { target: ['invoice_number'] },
      },
    );

    filter.catch(error, host);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 409,
        error: 'Conflict',
        message: 'Invoice number already exists',
      }),
    );
  });

  it('preserves the shape of an HttpException (404)', () => {
    const { host, res } = mockHost();
    filter.catch(new NotFoundException('Invoice not found'), host);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 404,
        message: 'Invoice not found',
        error: 'Not Found',
      }),
    );
  });

  it('keeps validation error arrays intact (400)', () => {
    const { host, res } = mockHost();
    filter.catch(
      new BadRequestException(['dueDate must be on or after invoiceDate']),
      host,
    );
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        message: ['dueDate must be on or after invoiceDate'],
      }),
    );
  });

  it('falls back to 500 for unexpected errors', () => {
    const { host, res } = mockHost();
    filter.catch(new Error('boom'), host);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
