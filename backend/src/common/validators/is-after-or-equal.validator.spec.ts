import type { ValidationArguments } from 'class-validator';
import { IsAfterOrEqualConstraint } from './is-after-or-equal.validator';

describe('IsAfterOrEqualConstraint (dueDate >= invoiceDate)', () => {
  const constraint = new IsAfterOrEqualConstraint();
  const args = (invoiceDate: string, dueDate: string): ValidationArguments => ({
    value: dueDate,
    constraints: ['invoiceDate'],
    object: { invoiceDate, dueDate },
    property: 'dueDate',
    targetName: 'CreateInvoiceDto',
  });

  it('passes when dueDate is after invoiceDate', () => {
    expect(
      constraint.validate('2026-07-03', args('2026-06-03', '2026-07-03')),
    ).toBe(true);
  });

  it('passes when the dates are equal', () => {
    expect(
      constraint.validate('2026-06-03', args('2026-06-03', '2026-06-03')),
    ).toBe(true);
  });

  it('fails when dueDate is before invoiceDate', () => {
    expect(
      constraint.validate('2026-06-01', args('2026-06-15', '2026-06-01')),
    ).toBe(false);
  });

  it('defers (returns true) when a value is not a date-only string', () => {
    // @IsDateOnly owns the format error; this validator must not double-report.
    expect(
      constraint.validate(
        '2026-06-10T08:00:00Z',
        args('2026-06-15', '2026-06-10T08:00:00Z'),
      ),
    ).toBe(true);
    expect(constraint.validate('', args('2026-06-15', ''))).toBe(true);
  });

  it('produces the expected message', () => {
    expect(constraint.defaultMessage(args('2026-06-15', '2026-06-01'))).toBe(
      'dueDate must be on or after invoiceDate',
    );
  });
});
