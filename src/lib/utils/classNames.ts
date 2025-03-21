/**
 * Class Names Utility
 * 
 * A utility for conditionally joining class names together.
 * Similar to the popular 'clsx' or 'classnames' libraries.
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines multiple class names into a single string, merging Tailwind classes properly
 * 
 * @param inputs - Class names to combine
 * @returns Combined class name string
 * 
 * @example
 * cn('text-red-500', condition && 'bg-blue-500', 'p-4')
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
} 