import { format, parseISO, isValid } from 'date-fns';

/**
 * Formats a date string or Date object to a human-readable format.
 * Returns an empty string for null/undefined/invalid dates.
 */
export function formatDate(
  value: string | Date | null | undefined,
  pattern: string = 'MM/dd/yyyy'
): string {
  if (!value) return '';

  const date = typeof value === 'string' ? parseISO(value) : value;

  if (!isValid(date)) return '';

  return format(date, pattern);
}

/**
 * Formats a 10-digit phone number as (XXX) XXX-XXXX.
 * Strips non-digit characters first. Returns original value if not 10 digits.
 */
export function formatPhone(value: string | null | undefined): string {
  if (!value) return '';

  const digits = value.replace(/\D/g, '');

  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  if (digits.length === 11 && digits.startsWith('1')) {
    const local = digits.slice(1);
    return `(${local.slice(0, 3)}) ${local.slice(3, 6)}-${local.slice(6)}`;
  }

  return value;
}

/**
 * Formats a name in uppercase. Handles first + last or single name strings.
 */
export function formatName(
  firstName: string | null | undefined,
  lastName?: string | null | undefined
): string {
  const parts: string[] = [];

  if (firstName) parts.push(firstName.trim());
  if (lastName) parts.push(lastName.trim());

  return parts.join(' ').toUpperCase();
}

/**
 * Formats a number as US currency (e.g. $1,234.56).
 */
export function formatCurrency(
  value: number | string | null | undefined,
  decimals: number = 2
): string {
  if (value === null || value === undefined || value === '') return '';

  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(num)) return '';

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

/**
 * Formats a number as a percentage (e.g. 85.5%).
 */
export function formatPercent(
  value: number | string | null | undefined,
  decimals: number = 1
): string {
  if (value === null || value === undefined || value === '') return '';

  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(num)) return '';

  return `${num.toFixed(decimals)}%`;
}
