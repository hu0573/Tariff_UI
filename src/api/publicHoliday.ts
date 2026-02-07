// Public Holiday API functions
import apiClient from "./client";

export interface PublicHolidayRefreshConfig {
  frequency: "daily" | "weekly" | "monthly";
  execution_time: string;
  last_execution_time?: string;
}

export interface PublicHolidayDownloadHistoryRecord {
  execution_time: string;
  frequency: "daily" | "weekly" | "monthly";
  status: "Success" | "Failed";
  errors?: Array<{ year: number; error: string }>;
  years_processed?: { [year: string]: { holidays_count: number } };
}

export interface PublicHolidayDownloadHistory {
  records: PublicHolidayDownloadHistoryRecord[];
  total: number;
}

export interface PublicHolidayCalendarData {
  year: number;
  month: number;
  state: string;
  state_name: string;
  timezone: string;
  time_range: {
    start_utc_timestamp: number;
    end_utc_timestamp: number;
    duration_seconds: number;
  };
  holidays: Array<{
    name: string;
    state: string;
    start_utc_timestamp: number;
    end_utc_timestamp: number;
  }>;
}

export interface PublicHolidayQueryResponse {
  state: string;
  state_name: string;
  timezone: string;
  time_range: {
    start_utc_timestamp: number;
    end_utc_timestamp: number;
  };
  holidays: Array<{
    id: number;
    name: string;
    state: string;
    start_utc_timestamp: number;
    end_utc_timestamp: number;
  }>;
  total: number;
}

// API functions
export const publicHolidayApi = {
  // Configuration management
  getRefreshConfig: () => apiClient.get("/api/public-holidays/refresh/config"),

  updateRefreshConfig: (config: { frequency: string }) =>
    apiClient.post("/api/public-holidays/refresh/config", config),

  // History management
  getDownloadHistory: (limit: number = 30) =>
    apiClient.get(`/api/public-holidays/refresh/history?limit=${limit}`),

  // Calendar data
  getCalendarData: (params: {
    year?: number;
    month?: number;
    is_relative_time?: boolean;
    relative_time?: string;
    state?: string;
    timezone?: string;
  }) =>
    apiClient.get("/api/public-holidays/calendar", {
      params,
    }),

  // Holiday queries
  getHolidays: (params?: {
    state?: string;
    year?: number;
    is_relative_time?: boolean;
    relative_time?: string;
    start_utc_timestamp?: number;
    end_utc_timestamp?: number;
  }) => {
    return apiClient.get("/api/public-holidays", {
      params,
    });
  },

  // Available Years
  getAvailableYears: () => apiClient.get("/api/public-holidays/available-years"),


};
