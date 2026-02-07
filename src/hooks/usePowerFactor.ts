import { useQuery } from '@tanstack/react-query';
import { powerFactorApi } from '@/api/powerFactor';

export const usePowerFactorIntegrated = (
  params: {
    nmi: string;
    start_utc_timestamp: number;
    end_utc_timestamp: number;
    state: string;
    is_relative_time: boolean;
    relative_time?: string;
    exclude_zero_kva?: boolean;
  },
  enabled: boolean
) => {
  return useQuery({
    queryKey: ['power-factor', 'integrated', params],
    queryFn: () => powerFactorApi.integrated(params),
    enabled,
    staleTime: 5 * 60 * 1000  // 5 minutes cache
  });
};

export const useAggregateData = (
  params: {
    nmi: string;
    start_utc_timestamp: number;
    end_utc_timestamp: number;
    state: string;
    is_relative_time: boolean;
    relative_time?: string;
    exclude_zero_kva?: boolean;
  },
  enabled: boolean
) => {
  return useQuery({
    queryKey: ['power-factor', 'aggregate', params],
    queryFn: () => powerFactorApi.aggregate(params),
    enabled,
    staleTime: 5 * 60 * 1000
  });
};

export const useStatistics = (
  params: {
    nmi: string;
    start_utc_timestamp: number;
    end_utc_timestamp: number;
    state: string;
    is_relative_time: boolean;
    relative_time?: string;
    exclude_zero_kva?: boolean;
  },
  enabled: boolean
) => {
  return useQuery({
    queryKey: ['power-factor', 'statistics', params],
    queryFn: () => powerFactorApi.statistics(params),
    enabled,
    staleTime: 5 * 60 * 1000
  });
};
