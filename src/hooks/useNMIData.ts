// NMI Data Hook
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { nmiDataApi } from '@/api/nmiData';
import type { DateRangeResponse, ReadingsResponse } from '@/api/nmiData';
import { resolveStateTimezone } from '@/config/stateTimezones';
import { timeApi } from '@/api/time';
import { timeRangeApi } from '@/api/timeRange';

interface UseNMIDataOptions {
  nmi?: string;
  date?: string;
  sort?: 'asc' | 'desc';
  state?: string;
  timezone?: string;
  enabled?: boolean;
}

export const useNMIData = (options: UseNMIDataOptions = {}) => {
  const {
    nmi,
    date,
    sort = 'desc',
    state,
    timezone,
    enabled = true,
  } = options;

  const timezoneEntry = useMemo(() => {
    if (!state && !timezone) {
      return null;
    }

    try {
      return resolveStateTimezone(state, timezone);
    } catch (error) {
      console.warn('Unable to resolve timezone for NMI data hook', error);
      return null;
    }
  }, [state, timezone]);

  // Fetch date range
  const dateRangeQuery = useQuery<DateRangeResponse>({
    queryKey: ['nmi-data', 'date-range', nmi, timezoneEntry?.timezone],
    queryFn: () =>
      nmiDataApi
        .getDateRange(nmi!, { state, timezone: timezoneEntry?.timezone })
        .then(res => res.data),
    enabled: enabled && !!nmi && !!timezoneEntry,
  });

  // Calculate latest date from UTC range using backend API
  const latestDateQuery = useQuery({
    queryKey: ['nmi-data', 'latest-date', nmi, dateRangeQuery.data?.available_range?.end_utc_timestamp, timezoneEntry?.state],
    queryFn: async () => {
      const endTs = dateRangeQuery.data?.available_range?.end_utc_timestamp;
      // Use state if available, otherwise try to use timezone logic or default
      const queryState = timezoneEntry?.state || state || 'SA'; 
      
      if (!endTs) return null;

      try {
        const res = await timeApi.convertUtcToLocal({
          utc_timestamp: endTs,
          state: queryState
        });
        // Backend returns local_datetime like "2025-12-24 10:00:00"
        // We extract the date part "2025-12-24"
        return res.data.local_datetime?.split(' ')[0] || null;
      } catch (err) {
        console.warn('Failed to convert UTC to local date', err);
        return null; // Fallback or fail gracefully
      }
    },
    enabled: !!dateRangeQuery.data?.available_range?.end_utc_timestamp && !!timezoneEntry,
    staleTime: 1000 * 60 * 5, // 5 mins
  });

  const latestDate = latestDateQuery.data;
  const currentValue = date || latestDate;

  // Fetch readings with power metrics (Refactored to use getReadingsWithMetrics)
  const readingsQuery = useQuery<ReadingsResponse>({
    queryKey: [
      'nmi-data',
      'readings-metrics',
      nmi,
      currentValue,
      sort,
      timezoneEntry?.timezone,
    ],
    queryFn: async () => {
      if (!currentValue) {
        throw new Error('Date is required to fetch readings.');
      }
      if (!timezoneEntry) {
        throw new Error('Timezone could not be resolved for the selected state.');
      }

      // Use backend API to convert local date to UTC range
      // complying with "Backend for Calculation" principle
      const timeRangeRes = await timeRangeApi.getRangeForDates({
        state: timezoneEntry.state,
        timezone: timezoneEntry.timezone,
        start_date: currentValue,
        end_date: currentValue,
      });

      const { start_utc_timestamp, end_utc_timestamp } = timeRangeRes.data;

      return nmiDataApi
        .getReadingsWithMetrics(
          nmi!,
          start_utc_timestamp,
          end_utc_timestamp,
          {
            state: timezoneEntry.state,
            timezone: timezoneEntry.timezone,
          }
        )
        .then(res => res.data);
    },
    enabled: enabled && !!nmi && !!currentValue && !!timezoneEntry,
  });

  return {
    dateRange: dateRangeQuery.data,
    readings: readingsQuery.data,
    isLoadingDateRange: dateRangeQuery.isLoading,
    isLoadingReadings: readingsQuery.isLoading,
    isLoading: dateRangeQuery.isLoading || readingsQuery.isLoading,
    errorDateRange: dateRangeQuery.error,
    errorReadings: readingsQuery.error,
    error: dateRangeQuery.error || readingsQuery.error,
    refetchDateRange: dateRangeQuery.refetch,
    refetchReadings: readingsQuery.refetch,
    refetch: () => {
      dateRangeQuery.refetch();
      readingsQuery.refetch();
    },
    latestDate,
    currentDate: currentValue,
  };
};
