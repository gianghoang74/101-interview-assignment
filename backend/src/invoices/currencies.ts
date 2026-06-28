/**
 * Currencies the API can render a symbol for. This is the single source of
 * truth shared by the create DTO (to validate `currency`) and the service
 * (to derive `currencySymbol`), so a persisted invoice always has a symbol.
 */
export const CURRENCY_SYMBOLS: Record<string, string> = {
  AUD: 'AU$',
  USD: '$',
  GBP: '£',
  EUR: '€',
  NZD: 'NZ$',
  SGD: 'S$',
};

export const SUPPORTED_CURRENCIES = Object.keys(CURRENCY_SYMBOLS);
