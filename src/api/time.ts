
// Mock time API
export interface StatesResponse {
  states: string[];
}

export interface UtcToLocalRequest {
  state: string;
  utc_timestamp?: number;
  utc_timestamps?: number[];
}

export interface UtcToLocalResponse {
  state: string;
  utc_timestamp: number;
  local_datetime: string;
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  timezone: string;
}

export interface UtcToLocalBatchResponse {
  state: string;
  timezone: string;
  results: Array<{
    utc_timestamp: number;
    local_datetime: string;
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    second: number;
    error?: string;
  }>;
}

export const timeApi = {
  getStates: async (): Promise<StatesResponse> => {
     await new Promise((resolve) => setTimeout(resolve, 300));
    return { states: ['SA', 'VIC', 'NSW', 'QLD', 'TAS', 'ACT', 'WA', 'NT'] };
  },

  getCurrentTime: async (): Promise<{ data: { utc_timestamp: number } }> => {
    // Return current time
    return { data: { utc_timestamp: Math.floor(Date.now() / 1000) } };
  },

  convertUtcToLocal: async (params: UtcToLocalRequest): Promise<{ data: any }> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    
    const convert = (ts: number): any => {
      const date = new Date(ts * 1000);
      // Mock conversion: treat UTC as local for simplicity or just format it
      // In a real mock we might apply timezone offset.
      // Let's format as "YYYY-MM-DD HH:mm:ss"
      const y = date.getFullYear();
      const m = date.getMonth() + 1;
      const d = date.getDate();
      const h = date.getHours();
      const min = date.getMinutes();
      const s = date.getSeconds();
      const local_datetime = `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')} ${String(h).padStart(2,'0')}:${String(min).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
      
      return {
        utc_timestamp: ts,
        local_datetime,
        year: y,
        month: m,
        day: d,
        hour: h,
        minute: min,
        second: s,
        timezone: "Australia/Adelaide" // Mock timezone
      };
    };

    if (params.utc_timestamps) {
      return { 
        data: {
          state: params.state,
          timezone: "Australia/Adelaide",
          results: params.utc_timestamps.map(ts => convert(ts))
        } as UtcToLocalBatchResponse
      };
    } else if (params.utc_timestamp) {
       const res = convert(params.utc_timestamp);
       return { data: { ...res, state: params.state } as UtcToLocalResponse };
    }
    return { data: {} };
  },
};
