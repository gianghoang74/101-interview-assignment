import { type InvoiceStatus, Prisma } from '@prisma/client';

export type EffectiveStatus = InvoiceStatus | 'Overdue';

export type InvoiceWithRelations = Prisma.InvoiceGetPayload<{
  include: { customer: true; items: true };
}>;

/** UTC midnight of the current date — the boundary used for Overdue derivation. */
export function startOfTodayUtc(now: Date = new Date()): Date {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}

/**
 * Overdue is derived, never stored: a non-Paid invoice whose due date is before
 * today is reported as "Overdue"; otherwise the persisted status is returned.
 */
export function deriveStatus(
  status: InvoiceStatus,
  dueDate: Date,
  today: Date = startOfTodayUtc(),
): EffectiveStatus {
  if (status !== 'Paid' && dueDate.getTime() < today.getTime()) {
    return 'Overdue';
  }
  return status;
}

const toNum = (d: Prisma.Decimal): number => d.toNumber();
const toDateOnly = (d: Date): string => d.toISOString().slice(0, 10);

/** Shapes a persisted invoice (with customer + items) into the API response. */
export function mapInvoice(invoice: InvoiceWithRelations, today: Date) {
  return {
    invoiceId: invoice.invoiceId,
    invoiceNumber: invoice.invoiceNumber,
    invoiceReference: invoice.invoiceReference,
    invoiceDate: toDateOnly(invoice.invoiceDate),
    dueDate: toDateOnly(invoice.dueDate),
    currency: invoice.currency,
    currencySymbol: invoice.currencySymbol,
    description: invoice.description,
    status: deriveStatus(invoice.status, invoice.dueDate, today),
    invoiceSubTotal: toNum(invoice.invoiceSubTotal),
    totalTax: toNum(invoice.totalTax),
    totalDiscount: toNum(invoice.totalDiscount),
    totalAmount: toNum(invoice.totalAmount),
    totalPaid: toNum(invoice.totalPaid),
    balanceAmount: toNum(invoice.balanceAmount),
    customer: {
      id: invoice.customer.id,
      fullname: invoice.customer.fullname,
      email: invoice.customer.email,
      mobileNumber: invoice.customer.mobileNumber,
      address: invoice.customer.address,
    },
    items: invoice.items.map((it) => ({
      id: it.id,
      name: it.name,
      quantity: it.quantity,
      rate: toNum(it.rate),
    })),
    createdAt: invoice.createdAt.toISOString(),
    createdBy: invoice.createdBy,
  };
}
