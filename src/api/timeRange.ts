
// Mock time range API
export interface TimeRangeResponse {
  start_utc_timestamp: number;
  end_utc_timestamp: number;
}

interface BaseParams {
  state?: string;
  timezone?: string;
}

export const timeRangeApi = {
  getDayRange: async (_params: BaseParams & { date?: string; utc_timestamp?: number }) => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    // Simplified: return 24h range for today if no date provided
    const now = new Date();
    const start = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())).getTime() / 1000;
    return { data: { start_utc_timestamp: start, end_utc_timestamp: start + 86400 } as TimeRangeResponse };
  },

  getWeekRange: async (_params: BaseParams & { date_str: string; week_start?: "monday" | "sunday" }) => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    // Dummy returning current week approx
    const now = Math.floor(Date.now() / 1000);
    return { data: { start_utc_timestamp: now - 3 * 86400, end_utc_timestamp: now + 4 * 86400 } as TimeRangeResponse };
  },

  getMonthRange: async (params: BaseParams & { year: number; month: number }) => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const start = new Date(Date.UTC(params.year, params.month - 1, 1)).getTime() / 1000;
    const end = new Date(Date.UTC(params.year, params.month, 1)).getTime() / 1000;
    return { data: { start_utc_timestamp: start, end_utc_timestamp: end } as TimeRangeResponse };
  },

  getYearRange: async (params: BaseParams & { year: number }) => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const start = new Date(Date.UTC(params.year, 0, 1)).getTime() / 1000;
    const end = new Date(Date.UTC(params.year + 1, 0, 1)).getTime() / 1000;
    return { data: { start_utc_timestamp: start, end_utc_timestamp: end } as TimeRangeResponse };
  },

  getRangeForDates: async (
    params: BaseParams & {
      start_date?: string;
      end_date?: string;
      start_utc_timestamp?: number;
      end_utc_timestamp?: number;
    }
  ) => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return { 
      data: { 
        start_utc_timestamp: params.start_utc_timestamp || 0, 
        end_utc_timestamp: params.end_utc_timestamp || 0 
      } as TimeRangeResponse 
    };
  },

  getRelativeTimeRange: async (_params: BaseParams & { relative_time: string }) => {
     await new Promise((resolve) => setTimeout(resolve, 200));
     // Return arbitrary range for demo
     const now = Math.floor(Date.now() / 1000);
     return { data: { start_utc_timestamp: now - 30 * 86400, end_utc_timestamp: now } as TimeRangeResponse };
  }
};

export type { TimeRangeResponse as TimeRangeApiResponse };
