import { deriveStatus } from './invoices.mapper';

describe('deriveStatus (Overdue is derived, never stored)', () => {
  const today = new Date(Date.UTC(2026, 5, 26)); // 2026-06-26

  it('returns Overdue for non-Paid invoices past their due date', () => {
    expect(
      deriveStatus('Pending', new Date(Date.UTC(2026, 5, 20)), today),
    ).toBe('Overdue');
    expect(deriveStatus('Draft', new Date(Date.UTC(2026, 4, 1)), today)).toBe(
      'Overdue',
    );
  });

  it('never reports a Paid invoice as Overdue', () => {
    expect(deriveStatus('Paid', new Date(Date.UTC(2026, 0, 1)), today)).toBe(
      'Paid',
    );
  });

  it('keeps the stored status when the due date is today or later', () => {
    expect(
      deriveStatus('Pending', new Date(Date.UTC(2026, 5, 26)), today),
    ).toBe('Pending');
    expect(deriveStatus('Draft', new Date(Date.UTC(2026, 6, 1)), today)).toBe(
      'Draft',
    );
  });
});
