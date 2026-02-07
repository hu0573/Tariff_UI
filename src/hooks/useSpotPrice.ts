// React Query hooks for spot price
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { spotPriceApi } from '@/api/spotPrice';
import type { 
  DownloadConfig,
  AggregateDataParams, 
  StatisticsParams, 
  DateRangeResponse
} from '@/api/spotPrice';

// Download configuration hooks
export const useDownloadConfig = () => {
  return useQuery({
    queryKey: ['spot-price-download-config'],
    queryFn: () => spotPriceApi.getDownloadConfig().then(res => res.data),
  });
};

export const useUpdateDownloadConfig = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (config: DownloadConfig) => spotPriceApi.updateDownloadConfig(config),
    onSuccess: async () => {
      // Refresh config after update
      await queryClient.invalidateQueries({ queryKey: ['spot-price-download-config'] });
      
      // Show success message
      const { toastManager } = await import('@/components/common/Toast');
      toastManager.success('✓ Download configuration saved successfully!');
    },
    onError: async (error: any) => {
      console.error('Failed to update download config:', error);
      
      const { toastManager } = await import('@/components/common/Toast');
      const errorMsg = error?.response?.data?.detail || error?.response?.data?.message || error?.message || 'Failed to save configuration';
      toastManager.error(`✗ ${errorMsg}`);
    },
  });
};

// Download history hooks
export const useDownloadHistory = (limit: number = 30) => {
  return useQuery({
    queryKey: ['spot-price-download-history', limit],
    queryFn: () => spotPriceApi.getDownloadHistory(limit).then(res => res.data),
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
    refetchOnWindowFocus: false,
  });
};

// Data query hooks

export const useAggregateData = (params: AggregateDataParams, enabled: boolean = true) => {
  return useQuery({
    queryKey: [
      'spot-price-aggregate',
      params.state,
      params.start_utc_timestamp,
      params.end_utc_timestamp,
      params.price_unit,
      params.days_of_week?.join(','),
    ],
    queryFn: () => spotPriceApi.aggregateData(params).then(res => res.data),
    enabled:
      enabled &&
      !!params.state &&
      typeof params.start_utc_timestamp === 'number' &&
      typeof params.end_utc_timestamp === 'number',
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    refetchOnWindowFocus: false,
  });
};

export const useStatistics = (params: StatisticsParams, enabled: boolean = true) => {
  return useQuery({
    queryKey: [
      'spot-price-statistics',
      params.state,
      params.start_utc_timestamp,
      params.end_utc_timestamp,
      params.price_unit,
      params.days_of_week?.join(','),
    ],
    queryFn: () => spotPriceApi.getStatistics(params).then(res => res.data),
    enabled:
      enabled &&
      !!params.state &&
      typeof params.start_utc_timestamp === 'number' &&
      typeof params.end_utc_timestamp === 'number',
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    refetchOnWindowFocus: false,
  });
};

export const useTimezoneInfo = (state: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['spot-price-timezone-info', state],
    queryFn: () => spotPriceApi.getTimezoneInfo(state).then(res => res.data),
    enabled: enabled && !!state,
    staleTime: 60 * 60 * 1000, // Consider data fresh for 1 hour
    refetchOnWindowFocus: false,
  });
};

export const useDateRange = (state: string, enabled: boolean = true) => {
  return useQuery<DateRangeResponse>({
    queryKey: ['spot-price-date-range', state],
    queryFn: () => spotPriceApi.getDateRange(state).then(res => res.data),
    enabled: enabled && !!state,
    staleTime: 60 * 60 * 1000, // Consider data fresh for 1 hour
    refetchOnWindowFocus: false,
  });
};
