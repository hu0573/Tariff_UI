import { format, fromUnixTime } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

/**
 * Standard timezone for South Australia (SA)
 */
export const SA_TIMEZONE = 'Australia/Adelaide';

/**
 * Formats a Unix timestamp (seconds) to a readable string in SA time.
 * If the input is an ISO string (legacy), it handles it as well.
 * 
 * @param timestamp Unix timestamp in seconds or ISO string
 * @param formatStr date-fns format string (default: 'yyyy-MM-dd HH:mm:ss')
 * @returns Formatted date string in SA time
 */
export function formatToSATime(
  timestamp: number | string | null | undefined,
  formatStr: string = 'yyyy-MM-dd HH:mm:ss'
): string {
  if (timestamp === null || timestamp === undefined || timestamp === '') {
    return 'N/A';
  }

  let date: Date;
  if (typeof timestamp === 'number') {
    // Backend should send integers as per rules
    date = fromUnixTime(timestamp);
  } else {
    // Handle string (ISO format expected for legacy data)
    date = new Date(timestamp);
  }

  // Check if date is valid
  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }

  // Convert to SA timezone
  const zonedDate = toZonedTime(date, SA_TIMEZONE);
  
  return format(zonedDate, formatStr);
}

/**
 * Formats a Unix timestamp specifically for showing a date only in SA time.
 */
export function formatToSADate(timestamp: number | string | null | undefined): string {
  return formatToSATime(timestamp, 'yyyy-MM-dd');
}
