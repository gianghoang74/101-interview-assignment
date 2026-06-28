import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { parseDateOnlyUtc } from '../common/date';
import { PrismaService } from '../prisma/prisma.service';
import { CURRENCY_SYMBOLS } from './currencies';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import {
  InvoiceStatusFilter,
  ListInvoicesQueryDto,
  SortOrdering,
} from './dto/list-invoices.query';
import { mapInvoice, startOfTodayUtc } from './invoices.mapper';
import { calculateTotals } from './invoices.totals';

@Injectable()
export class InvoicesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Creates an invoice with status Draft; totals are computed server-side. */
  async create(dto: CreateInvoiceDto, userId: string) {
    const rate = new Prisma.Decimal(dto.item.rate).toDecimalPlaces(2);
    const totals = calculateTotals({
      quantity: dto.item.quantity,
      rate,
      taxPercent: dto.tax ?? 10,
      discount: dto.discount ?? 0,
      totalPaid: 0,
    });
    if (totals.totalAmount.lessThan(0)) {
      throw new BadRequestException(
        'Discount cannot exceed the subtotal plus tax',
      );
    }
    // currencySymbol is always derived server-side; currency is validated to be
    // one of the supported codes, so the lookup always resolves.
    const currencySymbol = CURRENCY_SYMBOLS[dto.currency];
    // Anchored to UTC midnight so storage matches validation and the Overdue
    // boundary regardless of the server's local timezone. Non-null by validation.
    const invoiceDate = parseDateOnlyUtc(dto.invoiceDate) as Date;
    const dueDate = parseDateOnlyUtc(dto.dueDate) as Date;

    // Customer find-or-create (by email) + invoice creation in one transaction,
    // so a duplicate invoice number rolls the customer insert back too. We never
    // update an existing customer, so prior invoices keep their original details.
    const invoice = await this.prisma.$transaction(async (tx) => {
      const customer =
        (await tx.customer.findUnique({
          where: { email: dto.customer.email },
        })) ??
        (await tx.customer.create({
          data: {
            fullname: dto.customer.fullname,
            email: dto.customer.email,
            mobileNumber: dto.customer.mobileNumber ?? null,
            address: dto.customer.address ?? null,
          },
        }));

      return tx.invoice.create({
        data: {
          invoiceNumber: dto.invoiceNumber,
          invoiceReference: dto.invoiceReference ?? null,
          invoiceDate,
          dueDate,
          currency: dto.currency,
          currencySymbol,
          description: dto.description ?? null,
          status: 'Draft',
          invoiceSubTotal: totals.invoiceSubTotal,
          totalTax: totals.totalTax,
          totalDiscount: totals.totalDiscount,
          totalAmount: totals.totalAmount,
          totalPaid: totals.totalPaid,
          balanceAmount: totals.balanceAmount,
          createdBy: userId,
          customerId: customer.id,
          items: {
            create: [
              {
                name: dto.item.name,
                quantity: dto.item.quantity,
                rate,
              },
            ],
          },
        },
        include: { customer: true, items: true },
      });
    });

    return mapInvoice(invoice, startOfTodayUtc());
  }

  /** Lists invoices with search, derivation-aware status filter, sort and pagination. */
  async findAll(query: ListInvoicesQueryDto) {
    const today = startOfTodayUtc();
    const and: Prisma.InvoiceWhereInput[] = [];

    if (query.keyword) {
      and.push({
        OR: [
          { invoiceNumber: { contains: query.keyword, mode: 'insensitive' } },
          {
            customer: {
              fullname: { contains: query.keyword, mode: 'insensitive' },
            },
          },
        ],
      });
    }
    if (query.status) {
      and.push(this.statusWhere(query.status, today));
    }
    // Date-range filter is on the invoice date, anchored to UTC midnight so the
    // bounds are inclusive of rows dated exactly on fromDate/toDate.
    const fromDate = query.fromDate ? parseDateOnlyUtc(query.fromDate) : null;
    if (fromDate) {
      and.push({ invoiceDate: { gte: fromDate } });
    }
    const toDate = query.toDate ? parseDateOnlyUtc(query.toDate) : null;
    if (toDate) {
      and.push({ invoiceDate: { lte: toDate } });
    }

    const where: Prisma.InvoiceWhereInput = and.length ? { AND: and } : {};
    const orderBy = {
      [query.sortBy]: query.ordering === SortOrdering.ASC ? 'asc' : 'desc',
    } as Prisma.InvoiceOrderByWithRelationInput;
    const skip = (query.page - 1) * query.pageSize;

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.invoice.findMany({
        where,
        orderBy,
        skip,
        take: query.pageSize,
        include: { customer: true, items: true },
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return {
      data: rows.map((r) => mapInvoice(r, today)),
      paging: { page: query.page, pageSize: query.pageSize, total },
    };
  }

  async findOne(id: string) {
    const today = startOfTodayUtc();
    const invoice = await this.prisma.invoice.findUnique({
      where: { invoiceId: id },
      include: { customer: true, items: true },
    });
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }
    return mapInvoice(invoice, today);
  }

  /**
   * Translates a requested status into a stored-status + due-date predicate so
   * the filtered list stays consistent with the derived "Overdue" status.
   */
  private statusWhere(
    status: InvoiceStatusFilter,
    today: Date,
  ): Prisma.InvoiceWhereInput {
    if (status === InvoiceStatusFilter.Paid) {
      return { status: 'Paid' };
    }
    if (status === InvoiceStatusFilter.Overdue) {
      return { status: { not: 'Paid' }, dueDate: { lt: today } };
    }
    if (status === InvoiceStatusFilter.Draft) {
      return { status: 'Draft', dueDate: { gte: today } };
    }
    // Pending
    return { status: 'Pending', dueDate: { gte: today } };
  }
}
