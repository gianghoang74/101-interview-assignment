import { Prisma } from '@prisma/client';

type DecimalValue = string | number | Prisma.Decimal;

export interface TotalsInput {
  quantity: number;
  rate: DecimalValue;
  taxPercent: DecimalValue;
  discount: DecimalValue;
  totalPaid?: DecimalValue;
}

export interface InvoiceTotals {
  invoiceSubTotal: Prisma.Decimal;
  totalTax: Prisma.Decimal;
  totalDiscount: Prisma.Decimal;
  totalAmount: Prisma.Decimal;
  totalPaid: Prisma.Decimal;
  balanceAmount: Prisma.Decimal;
}

const round2 = (d: Prisma.Decimal): Prisma.Decimal => d.toDecimalPlaces(2);

/**
 * Server-side money calculation — the single source of truth for invoice totals:
 *   subTotal      = quantity * rate
 *   taxAmount     = subTotal * (tax% / 100)
 *   totalAmount   = subTotal + taxAmount - discount
 *   balanceAmount = totalAmount - totalPaid
 *
 * All arithmetic uses Decimal to avoid floating-point error; results are rounded
 * to 2 decimal places.
 */
export function calculateTotals(input: TotalsInput): InvoiceTotals {
  const quantity = new Prisma.Decimal(input.quantity);
  const rate = new Prisma.Decimal(input.rate);
  const taxPercent = new Prisma.Decimal(input.taxPercent);
  const discount = new Prisma.Decimal(input.discount);
  const totalPaid = new Prisma.Decimal(input.totalPaid ?? 0);

  const subTotal = quantity.times(rate);
  const totalTax = subTotal.times(taxPercent).dividedBy(100);
  const totalAmount = subTotal.plus(totalTax).minus(discount);
  const balanceAmount = totalAmount.minus(totalPaid);

  return {
    invoiceSubTotal: round2(subTotal),
    totalTax: round2(totalTax),
    totalDiscount: round2(discount),
    totalAmount: round2(totalAmount),
    totalPaid: round2(totalPaid),
    balanceAmount: round2(balanceAmount),
  };
}
