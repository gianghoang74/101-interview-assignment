import { parseDateOnlyUtc } from './date';

describe('parseDateOnlyUtc', () => {
  it('parses a YYYY-MM-DD string to UTC midnight', () => {
    const d = parseDateOnlyUtc('2026-06-10');
    expect(d).not.toBeNull();
    expect(d?.getTime()).toBe(Date.UTC(2026, 5, 10));
    expect(d?.toISOString()).toBe('2026-06-10T00:00:00.000Z');
  });

  it('accepts a valid leap day', () => {
    expect(parseDateOnlyUtc('2024-02-29')?.getTime()).toBe(
      Date.UTC(2024, 1, 29),
    );
  });

  it('rejects datetime strings (date-only contract)', () => {
    expect(parseDateOnlyUtc('2026-06-10T08:00:00Z')).toBeNull();
    expect(parseDateOnlyUtc('2026-06-10 08:00:00')).toBeNull();
  });

  it('rejects impossible calendar dates', () => {
    expect(parseDateOnlyUtc('2026-13-01')).toBeNull(); // month
    expect(parseDateOnlyUtc('2026-02-31')).toBeNull(); // day rolls over
    expect(parseDateOnlyUtc('2025-02-29')).toBeNull(); // not a leap year
  });

  it('rejects malformed / non-string input', () => {
    expect(parseDateOnlyUtc('2026-6-3')).toBeNull(); // not zero-padded
    expect(parseDateOnlyUtc('06-10-2026')).toBeNull();
    expect(parseDateOnlyUtc('')).toBeNull();
    expect(parseDateOnlyUtc(undefined)).toBeNull();
    expect(parseDateOnlyUtc(20260610)).toBeNull();
  });
});
