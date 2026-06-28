import { format, parseISO } from 'date-fns';

/** Formats an ISO date string (yyyy-MM-dd) as e.g. "04 Jul 2026". */
export function formatDate(iso: string): string {
  const date = parseISO(iso);
  return Number.isNaN(date.getTime()) ? iso : format(date, 'dd MMM yyyy');
}
