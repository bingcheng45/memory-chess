import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a number with comma separators
 * Examples: 1000 -> 1,000, 1000000 -> 1,000,000
 */
export function formatNumber(value: number | null): string {
  if (value === null || isNaN(Number(value))) return '0';
  return new Intl.NumberFormat('en-US').format(value);
}
