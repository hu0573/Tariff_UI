/**
 * Date formatting utilities for TablesCharts pages
 * Provides consistent date/time formatting across all components
 */

import { format, parseISO, isValid } from 'date-fns';

/**
 * Format a date to YYYY-MM-DD
 */
export function formatDate(date: Date | string | number): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date);
    if (!isValid(dateObj)) return 'Invalid Date';
    return format(dateObj, 'yyyy-MM-dd');
  } catch {
    return 'Invalid Date';
  }
}

/**
 * Format a date to DD/MM/YYYY
 */
export function formatDateDMY(date: Date | string | number): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date);
    if (!isValid(dateObj)) return 'Invalid Date';
    return format(dateObj, 'dd/MM/yyyy');
  } catch {
    return 'Invalid Date';
  }
}

/**
 * Format a datetime to YYYY-MM-DD HH:mm:ss
 */
export function formatDateTime(date: Date | string | number): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date);
    if (!isValid(dateObj)) return 'Invalid DateTime';
    return format(dateObj, 'yyyy-MM-dd HH:mm:ss');
  } catch {
    return 'Invalid DateTime';
  }
}

/**
 * Format a datetime to DD/MM/YYYY HH:mm
 */
export function formatDateTimeDMY(date: Date | string | number): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date);
    if (!isValid(dateObj)) return 'Invalid DateTime';
    return format(dateObj, 'dd/MM/yyyy HH:mm');
  } catch {
    return 'Invalid DateTime';
  }
}

/**
 * Format a time to HH:mm
 */
export function formatTime(date: Date | string | number): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date);
    if (!isValid(dateObj)) return 'Invalid Time';
    return format(dateObj, 'HH:mm');
  } catch {
    return 'Invalid Time';
  }
}

/**
 * Format a month to YYYY-MM
 */
export function formatMonth(year: number, month: number): string {
  const monthStr = month.toString().padStart(2, '0');
  return `${year}-${monthStr}`;
}

/**
 * Format a month to Month YYYY (e.g., "January 2024")
 */
export function formatMonthName(year: number, month: number): string {
  try {
    const date = new Date(year, month - 1, 1);
    if (!isValid(date)) return 'Invalid Month';
    return format(date, 'MMMM yyyy');
  } catch {
    return 'Invalid Month';
  }
}

/**
 * Parse YYYY-MM string to year and month
 */
export function parseMonthString(monthStr: string): { year: number; month: number } | null {
  const match = monthStr.match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;
  
  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  
  if (month < 1 || month > 12) return null;
  
  return { year, month };
}

/**
 * Get current month in YYYY-MM format
 */
export function getCurrentMonth(): string {
  const now = new Date();
  return formatMonth(now.getFullYear(), now.getMonth() + 1);
}

/**
 * Get previous month in YYYY-MM format
 */
export function getPreviousMonth(year: number, month: number): string {
  if (month === 1) {
    return formatMonth(year - 1, 12);
  }
  return formatMonth(year, month - 1);
}

/**
 * Get next month in YYYY-MM format
 */
export function getNextMonth(year: number, month: number): string {
  if (month === 12) {
    return formatMonth(year + 1, 1);
  }
  return formatMonth(year, month + 1);
}

/**
 * Convert UTC timestamp to local date string
 */
export function utcToLocalDateString(utcTimestamp: number): string {
  try {
    const date = new Date(utcTimestamp * 1000);
    if (!isValid(date)) return 'Invalid Date';
    return formatDateTime(date);
  } catch {
    return 'Invalid Date';
  }
}

/**
 * Get day of week name (e.g., "Monday")
 */
export function getDayOfWeekName(date: Date | string | number): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date);
    if (!isValid(dateObj)) return 'Invalid Date';
    return format(dateObj, 'EEEE');
  } catch {
    return 'Invalid Date';
  }
}

/**
 * Get short day of week name (e.g., "Mon")
 */
export function getShortDayOfWeekName(date: Date | string | number): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date);
    if (!isValid(dateObj)) return 'Invalid';
    return format(dateObj, 'EEE');
  } catch {
    return 'Invalid';
  }
}
