
import apiClient from './client';
import type { IntegratedResponse } from '@/pages/TablesCharts/AverageDailyUsage/types';

export interface V2Response<T> {
  success: boolean;
  data: T;
  meta: any;
}

/**
 * API client for Average Daily Usage Profile
 */
export const averageDailyUsageApi = {
  /**
   * Get integrated average daily usage data (Profile + Statistics)
   */
  getIntegrated: (params: {
    nmi: string;
    start_utc_timestamp?: number;
    end_utc_timestamp?: number;
    state: string;
    is_relative_time?: boolean;
    relative_time?: string;
  }) => {
    return apiClient.get<V2Response<IntegratedResponse>>('/api/v2/charts/average-daily-usage/profile', { params })
      .then(res => ({ ...res, data: res.data.data }));
  },
};
