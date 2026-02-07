import { useQuery } from '@tanstack/react-query';
import { averageDailyUsageApi } from '@/api/averageDailyUsage';

/**
 * Hook to fetch integrated average daily usage data (Profile + Statistics)
 */
export const useAverageDailyUsageIntegrated = (
  params: {
    nmi: string;
    start_utc_timestamp?: number;
    end_utc_timestamp?: number;
    state: string;
    is_relative_time?: boolean;
    relative_time?: string;
  },
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ['average-daily-usage', 'integrated', params],
    queryFn: async () => {
      const response = await averageDailyUsageApi.getIntegrated(params);
      return response.data;
    },
    enabled: enabled && !!params.nmi && (params.is_relative_time || (!!params.start_utc_timestamp && !!params.end_utc_timestamp)),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
