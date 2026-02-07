
// Mock NMI Data API functions

export interface V2Response<T> {
  success: boolean;
  data: T;
  meta: any;
}

export interface TimeRangeMeta {
  start_utc_timestamp: number;
  end_utc_timestamp: number;
  local_start?: string;
  local_end?: string;
  local_start_date?: string;
  local_end_date?: string;
  duration_seconds?: number;
}

export interface AvailableRange {
  state: string;
  timezone: string;
  start_date: string;
  end_date: string;
  start_timestamp: number;
  end_timestamp: number;
  count: number;
  time_range?: TimeRangeMeta;
}

export interface DateRangeResponse {
  nmi: string;
  state?: string;
  timezone?: string;
  available_range?: {
    start_utc_timestamp: number;
    end_utc_timestamp: number;
  };
}

export interface Reading {
  local_time: string;
  timestamp_utc: number;
  [key: string]: string | number | null | undefined;
}

export interface ReadingsResponse {
  nmi: string;
  state?: string;
  timezone?: string;
  date: string;
  total_count: number;
  time_range: TimeRangeMeta;
  readings: Reading[];
}

export interface NMIDataReadingsIntegrated {
  readings: Reading[];
  total_count: number;
  time_range: {
    start_utc_timestamp: number;
    end_utc_timestamp: number;
  };
}

export interface CacheStatusResponse {
  has_cache: boolean;
  is_valid: boolean;
  cache_path?: string;
  created_at?: string;
  expires_at?: number;
  expires_at_adelaide?: string;
  time_until_expiry?: string;
}

export interface DownloadTempResponse {
  success: boolean;
  message: string;
  cache_path?: string;
  expires_at?: number;
  expires_at_adelaide?: string;
  date_range?: {
    start_date: string;
    end_date: string;
    start_timestamp: number;
    end_timestamp: number;
  };
}

export interface TimezoneQuery {
  state?: string;
  timezone?: string;
}

export interface DownloadRequest {
  start_utc_timestamp: number;
  end_utc_timestamp: number;
  sort: "asc" | "desc";
}

export interface DownloadResponse {
  download_id: string;
  status: string;
  message: string;
}

export interface IntegrityCheckResponse {
  nmi: string;
  is_complete: boolean;
  details: {
    head_ok: boolean;
    tail_ok: boolean;
    head_count: number;
    tail_count: number;
  };
}

export const nmiDataApi = {
  // Get available date range for NMI
  getDateRange: async (nmi: string, params?: TimezoneQuery) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const now = Math.floor(Date.now() / 1000);
    const twoYearsAgo = now - 2 * 365 * 24 * 3600;
    
    return {
      data: {
        nmi,
        state: params?.state || "SA",
        timezone: "Australia/Adelaide",
        available_range: {
          start_utc_timestamp: twoYearsAgo,
          end_utc_timestamp: now,
        }
      } as DateRangeResponse
    };
  },

  // Get readings for a specific date
  // getReadings removed (replaced by V2 below)

  // Get cache status
  getCacheStatus: async (_nmi: string) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return { data: { has_cache: true, is_valid: true } as CacheStatusResponse };
  },

  // Download temp data
  downloadTemp: async (_nmi: string) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return { data: { success: true, message: "Started" } as DownloadTempResponse };
  },

  // Get readings for a timestamp range
  getReadingsRange: async (
    nmi: string,
    startUtcTimestamp: number,
    endUtcTimestamp: number,
    // Unused sort param commented
    // _sort: "asc" | "desc" = "asc",
    params?: TimezoneQuery
  ) => {
     await new Promise((resolve) => setTimeout(resolve, 600));
     return {
      data: {
        nmi,
        state: params?.state || "SA",
        timezone: "Australia/Adelaide",
        date: "Range",
        total_count: 0,
        time_range: {
          start_utc_timestamp: startUtcTimestamp,
          end_utc_timestamp: endUtcTimestamp
        },
        readings: []
      } as ReadingsResponse
    };
  },

  // Get readings with power metrics for a specific date
  getReadingsWithMetrics: async (
    nmi: string,
    startUtcTimestamp: number,
    endUtcTimestamp: number,
    // Unused sort param commented
    // _sort: "asc" | "desc" = "desc",
    params?: TimezoneQuery
  ) => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    return {
      data: {
        nmi,
        state: params?.state || "SA",
        timezone: "Australia/Adelaide",
        date: "2024-01-01",
        total_count: 0,
        time_range: {
          start_utc_timestamp: startUtcTimestamp,
          end_utc_timestamp: endUtcTimestamp
        },
        readings: []
      } as ReadingsResponse
    };
  },

  // Create power metrics download task
  submitDownload: async (
    _nmi: string,
    _request: DownloadRequest,
    _params?: TimezoneQuery
  ) => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return {
      data: {
        download_id: "mock-download-id",
        status: "processing",
        message: "Download started"
      } as DownloadResponse
    };
  },

  // Get download status
  getDownloadStatus: async (_downloadId: string) => {
     await new Promise((resolve) => setTimeout(resolve, 300));
     // Simulate completion
     return { data: { status: "completed", download_url: "#" } };
  },

  // Get download file
  getDownloadFile: async (_downloadId: string) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return { data: new Blob(["Mock CSV Data"], { type: 'text/csv' }) };
  },

  // Check data integrity
  checkIntegrity: async (
    nmi: string,
    _startUtcTimestamp: number,
    _endUtcTimestamp: number
  ) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return {
      data: {
        nmi,
        is_complete: true,
        details: { head_ok: true, tail_ok: true, head_count: 10, tail_count: 10 }
      } as IntegrityCheckResponse
    };
  },

  // Get readings with metrics optimized (V2 Integrated)
  getReadings: async (
    _nmi: string,
    dateRange: { start: string; end: string },
    // Unused params commented
    // _sort: "asc" | "desc" = "asc",
    // _params?: TimezoneQuery
  ) => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    const startUtcTimestamp = new Date(dateRange.start).getTime() / 1000;
    const endUtcTimestamp = new Date(dateRange.end).getTime() / 1000;
    return {
      data: {
        success: true,
        data: {
          readings: [],
          total_count: 0,
          time_range: { start_utc_timestamp: startUtcTimestamp, end_utc_timestamp: endUtcTimestamp }
        },
        meta: {}
      } as V2Response<NMIDataReadingsIntegrated>
    };
  }
};
