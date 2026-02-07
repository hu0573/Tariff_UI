/**
 * Time range processing hook
 * Handles time range calculations and conversions
 */

import { useMemo } from 'react';
import { formatMonth, parseMonthString, getPreviousMonth } from '../utils/dateFormatters';

export interface TimeRangeConfig {
  year: number;
  month: number;
  isRelativeTime: boolean;
  relativeOption?: string;
}

export interface TimeRangeResult {
  year: number;
  month: number;
  monthString: string;
  startDate: Date;
  endDate: Date;
  displayLabel: string;
}

/**
 * Hook to process time range based on configuration
 */
export function useTimeRange(config: TimeRangeConfig): TimeRangeResult {
  return useMemo(() => {
    let finalYear = config.year;
    let finalMonth = config.month;

    // Handle relative time options
    if (config.isRelativeTime && config.relativeOption) {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;

      switch (config.relativeOption) {
        case 'current_month':
          finalYear = currentYear;
          finalMonth = currentMonth;
          break;
        case 'last_month':
          const prevMonth = getPreviousMonth(currentYear, currentMonth);
          const parsed = parseMonthString(prevMonth);
          if (parsed) {
            finalYear = parsed.year;
            finalMonth = parsed.month;
          }
          break;
        case 'last_3_months':
          // Use 3 months ago
          let tempYear = currentYear;
          let tempMonth = currentMonth - 2;
          while (tempMonth <= 0) {
            tempMonth += 12;
            tempYear -= 1;
          }
          finalYear = tempYear;
          finalMonth = tempMonth;
          break;
        case 'last_6_months':
          // Use 6 months ago
          let tempYear6 = currentYear;
          let tempMonth6 = currentMonth - 5;
          while (tempMonth6 <= 0) {
            tempMonth6 += 12;
            tempYear6 -= 1;
          }
          finalYear = tempYear6;
          finalMonth = tempMonth6;
          break;
        case 'last_12_months':
          // Use 12 months ago
          finalYear = currentYear - 1;
          finalMonth = currentMonth;
          break;
      }
    }

    // Calculate start and end dates
    const startDate = new Date(finalYear, finalMonth - 1, 1);
    const endDate = new Date(finalYear, finalMonth, 0, 23, 59, 59, 999);

    // Generate display label
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const displayLabel = `${monthNames[finalMonth - 1]} ${finalYear}`;

    return {
      year: finalYear,
      month: finalMonth,
      monthString: formatMonth(finalYear, finalMonth),
      startDate,
      endDate,
      displayLabel,
    };
  }, [config.year, config.month, config.isRelativeTime, config.relativeOption]);
}

/**
 * Get available months for a given year
 * Returns months from 1 to current month if year is current year, otherwise 1-12
 */
export function useAvailableMonths(year: number): number[] {
  return useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    if (year === currentYear) {
      return Array.from({ length: currentMonth }, (_, i) => i + 1);
    }
    return Array.from({ length: 12 }, (_, i) => i + 1);
  }, [year]);
}

/**
 * Get available years based on a range
 */
export function useAvailableYears(
  startYear?: number,
  endYear?: number
): number[] {
  return useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const start = startYear ?? currentYear - 5;
    const end = endYear ?? currentYear;

    const years: number[] = [];
    for (let year = end; year >= start; year--) {
      years.push(year);
    }
    return years;
  }, [startYear, endYear]);
}

/**
 * Calculate date range for relative time options
 */
export function calculateRelativeDateRange(
  relativeOption: string
): { startDate: Date; endDate: Date } | null {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  switch (relativeOption) {
    case 'current_month':
      return {
        startDate: new Date(currentYear, currentMonth, 1),
        endDate: new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999),
      };
    case 'last_month':
      return {
        startDate: new Date(currentYear, currentMonth - 1, 1),
        endDate: new Date(currentYear, currentMonth, 0, 23, 59, 59, 999),
      };
    case 'last_3_months':
      return {
        startDate: new Date(currentYear, currentMonth - 3, 1),
        endDate: new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999),
      };
    case 'last_6_months':
      return {
        startDate: new Date(currentYear, currentMonth - 6, 1),
        endDate: new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999),
      };
    case 'last_12_months':
      return {
        startDate: new Date(currentYear - 1, currentMonth, 1),
        endDate: new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999),
      };
    default:
      return null;
  }
}
