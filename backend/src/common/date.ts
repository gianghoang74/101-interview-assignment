/**
 * Date-only helpers.
 *
 * Invoice dates are calendar dates (no time, no zone) and are stored in
 * `@db.Date` columns. To keep validation, persistence, and the "Overdue"
 * boundary in agreement on every host regardless of its local timezone, we
 * accept only `YYYY-MM-DD` strings and anchor them to UTC midnight.
 */

export const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Parses a strict `YYYY-MM-DD` string into a UTC-midnight Date.
 * Returns null for anything else (datetimes, bad formats, impossible
 * calendar dates such as `2026-02-31`).
 */
export function parseDateOnlyUtc(value: unknown): Date | null {
  if (typeof value !== 'string' || !DATE_ONLY_REGEX.test(value)) {
    return null;
  }
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  // Reject values that rolled over (e.g. 2026-02-31 -> 2026-03-03).
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date;
}
