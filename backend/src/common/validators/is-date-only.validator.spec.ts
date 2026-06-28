import type { ValidationArguments } from 'class-validator';
import { IsDateOnlyConstraint } from './is-date-only.validator';

describe('IsDateOnlyConstraint', () => {
  const constraint = new IsDateOnlyConstraint();

  it('accepts a valid YYYY-MM-DD date', () => {
    expect(constraint.validate('2026-06-10')).toBe(true);
  });

  it('rejects datetimes and malformed values', () => {
    expect(constraint.validate('2026-06-10T00:00:00Z')).toBe(false);
    expect(constraint.validate('2026-02-31')).toBe(false);
    expect(constraint.validate('nope')).toBe(false);
    expect(constraint.validate(undefined)).toBe(false);
  });

  it('produces a helpful message', () => {
    expect(
      constraint.defaultMessage({
        property: 'invoiceDate',
      } as ValidationArguments),
    ).toBe('invoiceDate must be a valid calendar date in YYYY-MM-DD format');
  });
});
