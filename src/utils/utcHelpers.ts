import { fromZonedTime } from 'date-fns-tz';

interface DateParts {
  year: number;
  month: number;
  day: number;
  hour?: number;
  minute?: number;
  second?: number;
}

/**
 * Converts local date parts (in a specific timezone) to a UTC unix timestamp (seconds).
 * 
 * @param parts Object containing year, month (1-12), day, and optional time parts
 * @param timeZone The timezone of the local date (e.g., 'Australia/Adelaide', 'UTC', or browser default)
 * @returns UTC timestamp in seconds
 */
export function localDatePartsToUtcSeconds(
  parts: DateParts,
  timeZone: string
): number {
  const { year, month, day, hour = 0, minute = 0, second = 0 } = parts;
  
  // Construct an ISO-like date string that will be interpreted in the given timezone
  // Format: YYYY-MM-DDTHH:mm:ss.sss
  const dateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;
  
  try {
    const date = fromZonedTime(dateString, timeZone);
    return Math.floor(date.getTime() / 1000);
  } catch (error) {
    console.warn(`Error converting date parts to UTC with timezone ${timeZone}:`, error);
    // Fallback: Treat as local system time if timezone conversion fails
    // Note: This matches legacy behavior but ignores the explicit timeZone argument if it's invalid
    const fallbackDate = new Date(year, month - 1, day, hour, minute, second);
    return Math.floor(fallbackDate.getTime() / 1000);
  }
}
