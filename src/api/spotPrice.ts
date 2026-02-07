// Spot Price API functions
import apiClient from './client';

export interface DownloadConfig {
  frequency: 'daily' | 'weekly' | 'monthly';
  execution_time: string;
}

export interface DownloadHistoryRecord {
  execution_time: string;
  success_count: number;
  failed_count: number;
  status: 'Success' | 'Partial' | 'Failed';
  errors?: Array<{ error: string }>;
}

export interface DownloadHistory {
  total: number;
  limit: number;
  records: DownloadHistoryRecord[];
}

export interface QueryDataParams {
  state: string;
  start_utc_timestamp: number;
  end_utc_timestamp: number;
  days_of_week?: number[];
  price_unit?: string;
}

export interface AggregateDataParams {
  state: string;
  start_utc_timestamp: number;
  end_utc_timestamp: number;
  days_of_week?: number[];
  price_unit?: string;
}

export interface StatisticsParams {
  state: string;
  start_utc_timestamp: number;
  end_utc_timestamp: number;
  days_of_week?: number[];
  price_unit?: string;
}

export interface AggregateDataPoint {
  timestamp_utc: number; // Start of the 5-minute interval in UTC
  avg_price: number;
  max_price: number;
  min_price: number;
  max_price_timestamp?: number; // UTC timestamp when max_price occurred
  min_price_timestamp?: number; // UTC timestamp when min_price occurred
  count: number;
}

export interface AggregateDataResponse {
  state: string;
  timezone: string;
  start_date: string;
  end_date: string;
  days_of_week: number[] | null;
  price_unit: string;
  count: number;
  time_range: TimeRangeMeta;
  data: AggregateDataPoint[];
}

export interface StatisticsResponse {
  state: string;
  timezone: string;
  start_date: string;
  end_date: string;
  days_of_week: number[] | null;
  price_unit: string;
  overall_avg: number;
  highest_price: number;
  lowest_price: number;
  highest_price_timestamp?: number;
  lowest_price_timestamp?: number;
  count: number;
}

export interface TimeRangeMeta {
  start_timestamp: number;
  end_timestamp: number;
  local_start: string;
  local_end: string;
  local_start_date: string;
  local_end_date: string;
  duration_seconds: number;
}

export interface TimezoneInfo {
  state: string;
  capital: string;
  timezone_name: string;
  timezone_abbr: string;
  utc_offset_hours: number;
  is_dst: boolean;
  dst_status: string;
  aest_relation: string;
  display_text: string;
  detailed_info: string;
}

export interface DateRangeResponse {
  state: string;
  timezone: string;
  start_utc_timestamp: number;
  end_utc_timestamp: number;
}

export const spotPriceApi = {
  // Download configuration
  getDownloadConfig: () =>
    apiClient.get<DownloadConfig>('/api/spot-price/download/config'),
  
  updateDownloadConfig: (config: DownloadConfig) =>
    apiClient.post<DownloadConfig>('/api/spot-price/download/config', config),
  
  // Download history
  getDownloadHistory: (limit: number = 30) =>
    apiClient.get<DownloadHistory>('/api/spot-price/download/history', { params: { limit } }),
  
  // Data query
  queryData: (params: QueryDataParams) =>
    apiClient.get('/api/spot-price/query', {
      params: {
        state: params.state,
        start_utc_timestamp: params.start_utc_timestamp,
        end_utc_timestamp: params.end_utc_timestamp,
        price_unit: params.price_unit,
        days_of_week: params.days_of_week?.join(','),
      },
    }),
  
  // Aggregate data
  aggregateData: (params: AggregateDataParams) =>
    apiClient.get<AggregateDataResponse>('/api/spot-price/aggregate', {
      params: {
        state: params.state,
        start_utc_timestamp: params.start_utc_timestamp,
        end_utc_timestamp: params.end_utc_timestamp,
        price_unit: params.price_unit,
        days_of_week: params.days_of_week?.join(','),
      },
    }),
  
  // Statistics
  getStatistics: (params: StatisticsParams) =>
    apiClient.get<StatisticsResponse>('/api/spot-price/statistics', {
      params: {
        state: params.state,
        start_utc_timestamp: params.start_utc_timestamp,
        end_utc_timestamp: params.end_utc_timestamp,
        price_unit: params.price_unit,
        days_of_week: params.days_of_week?.join(','),
      },
    }),
  
  // Timezone info
  getTimezoneInfo: (state: string) =>
    apiClient.get<TimezoneInfo>('/api/spot-price/timezone-info', { params: { state } }),
  
  // Date range
  getDateRange: (state: string) =>
    apiClient.get<DateRangeResponse>('/api/spot-price/date-range', { params: { state } }),

  
  // Integrity check for spot prices
  checkIntegrity: (params: { state: string; start_utc_timestamp: number; end_utc_timestamp: number }) =>
    apiClient.get<IntegrityCheckResponse>('/api/spot-price/check-integrity', {
      params: {
        state: params.state,
        start_utc_timestamp: params.start_utc_timestamp,
        end_utc_timestamp: params.end_utc_timestamp,
      }
    }),
};

export interface IntegrityCheckResponse {
  state: string;
  region: string;
  is_complete: boolean;
  details: {
    head_ok: boolean;
    tail_ok: boolean;
    head_count: number;
    tail_count: number;
  };
}
