import { format, parseISO } from 'date-fns'

/**
 * Format date for display
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'MMM dd, yyyy')
}

/**
 * Format date and time for display
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'MMM dd, yyyy HH:mm')
}

/**
 * Format currency
 */
export function formatCurrency(
  amount: number,
  currency: string = 'USD',
): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount)
}

/**
 * Format full name
 */
export function formatFullName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`.trim()
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number = 50): string {
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text
}

/**
 * Generate initials from name
 */
export function getInitials(firstName: string, lastName: string): string {
  return `${firstName[0]}${lastName[0]}`.toUpperCase()
}
