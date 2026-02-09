import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind CSS classes safely
 * Handles conflicts and removes duplicate utilities
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
