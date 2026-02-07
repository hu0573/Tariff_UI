import apiClient from './client';

// API Response Types
export interface AggregateDataPoint {
  time: string;              // "00:00", "00:05", ...
  hour: number;              // 0-23
  minute: number;            // 0, 5, 10, ..., 55
  avg_pf: number | null;     // Average Power Factor
  max_pf: number | null;     // Max Power Factor
  min_pf: number | null;     // Min Power Factor
  max_pf_timestamp?: number; // UTC timestamp of max value
  min_pf_timestamp?: number; // UTC timestamp of min value
  count: number;             // Number of data points in this bucket
}

export interface AggregateResponse {
  nmi: string;
  state: string;
  start_utc_timestamp: number;   // UTC timestamp
  end_utc_timestamp: number;     // UTC timestamp
  timezone: string;              // "Australia/Adelaide"
  interval_minutes: number;    // Detected interval
  data: AggregateDataPoint[];
  total_days: number;        // Number of days aggregated
}

export interface StatisticsResponse {
  overall_avg_pf: number | null;           // Overall average PF
  highest_value: number | null;            // Highest PF
  highest_value_timestamp: number | null;  // UTC timestamp
  lowest_value: number | null;             // Lowest PF
  lowest_value_timestamp: number | null;   // UTC timestamp
}

export interface V2Response<T> {
  success: boolean;
  data: T;
  meta: any;
}

export interface PowerFactorIntegratedResponse {
  data: AggregateDataPoint[];
  statistics: StatisticsResponse;
  total_days: number;
  interval_minutes: number;
  timezone?: string;
  start_utc_timestamp?: number;
  end_utc_timestamp?: number;
}

export const powerFactorApi = {
  /**
   * Get integrated power factor data (Profile + Statistics)
   */
  integrated: (params: {
    nmi: string;
    start_utc_timestamp: number;
    end_utc_timestamp: number;
    state: string;
    is_relative_time: boolean;
    relative_time?: string;
    exclude_zero_kva?: boolean;
  }) => {
    return apiClient.get<V2Response<PowerFactorIntegratedResponse>>('/api/v2/charts/power-factor/integrated', { params })
      .then(res => res.data.data);
  },

  /**
   * Get aggregated power factor data (Legacy - calling integrated)
   */
  aggregate: (params: {
    nmi: string;
    start_utc_timestamp: number;
    end_utc_timestamp: number;
    state: string;
    is_relative_time: boolean;
    relative_time?: string;
    exclude_zero_kva?: boolean;
  }) => {
    return apiClient.get<V2Response<PowerFactorIntegratedResponse>>('/api/v2/charts/power-factor/integrated', { params })
      .then(res => res.data.data);
  },

  /**
   * Get power factor statistics (Legacy - calling integrated)
   */
  statistics: (params: {
    nmi: string;
    start_utc_timestamp: number;
    end_utc_timestamp: number;
    state: string;
    is_relative_time: boolean;
    relative_time?: string;
    exclude_zero_kva?: boolean;
  }) => {
    return apiClient.get<V2Response<PowerFactorIntegratedResponse>>('/api/v2/charts/power-factor/integrated', { params })
      .then(res => res.data.data.statistics);
  }
};
