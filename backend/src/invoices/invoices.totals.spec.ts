import { calculateTotals } from './invoices.totals';

describe('calculateTotals (server-side money calculation)', () => {
  it('computes totals for the sample invoice', () => {
    const t = calculateTotals({
      quantity: 2,
      rate: 1000,
      taxPercent: 10,
      discount: 20,
      totalPaid: 1451.34,
    });
    expect(t.invoiceSubTotal.toNumber()).toBe(2000);
    expect(t.totalTax.toNumber()).toBe(200);
    expect(t.totalDiscount.toNumber()).toBe(20);
    expect(t.totalAmount.toNumber()).toBe(2180);
    expect(t.totalPaid.toNumber()).toBe(1451.34);
    expect(t.balanceAmount.toNumber()).toBe(728.66);
  });

  it('applies subTotal + tax - discount and rounds to 2dp', () => {
    // subTotal 99.99, tax 9.999 -> 10.00, total 109.99
    const t = calculateTotals({
      quantity: 1,
      rate: 99.99,
      taxPercent: 10,
      discount: 0,
    });
    expect(t.invoiceSubTotal.toNumber()).toBe(99.99);
    expect(t.totalTax.toNumber()).toBe(10);
    expect(t.totalAmount.toNumber()).toBe(109.99);
  });

  it('balance equals total when nothing is paid', () => {
    const t = calculateTotals({
      quantity: 3,
      rate: 100,
      taxPercent: 10,
      discount: 50,
    });
    expect(t.totalAmount.toNumber()).toBe(280); // 300 + 30 - 50
    expect(t.balanceAmount.toNumber()).toBe(280);
  });
});
