import apiClient from "./client";

export interface PowerReading {
  time: string;
  Production: number;
  Consumption: number;
  SelfConsumption: number;
  FeedIn: number;
  Purchased: number;
}

export interface PowerDetailsResponse {
  siteId: number;
  date: string;
  unit: string;
  readings: PowerReading[];
}

export interface SolarEdgeConfigResponse {
  is_configured: boolean;
  masked_api_key?: string;
}

export interface SolarEdgeConfigUpdate {
  api_key: string;
}

export interface TestConnectionRequest {
  api_key?: string;
}

export interface TestConnectionResponse {
  success: boolean;
  message: string;
  count?: number;
}



export const solaredgeApi = {
  // Configuration endpoints
  getConfig: () =>
    apiClient.get<SolarEdgeConfigResponse>(`/api/solaredge/config`),

  updateConfig: (data: SolarEdgeConfigUpdate) =>
    apiClient.put<{ success: boolean; message: string }>(`/api/solaredge/config`, data),

  testConnection: (data?: TestConnectionRequest) =>
    apiClient.post<TestConnectionResponse>(`/api/solaredge/test-connection`, data || {}),



  // Data endpoints
  getPowerDetails: (siteId: number, date: string) =>
    apiClient.get<PowerDetailsResponse>(`/api/solaredge/power-details`, {
      params: { siteId, date },
    }),

  exportCsv: (siteId: number, startDate: string, endDate: string) =>
    apiClient.get(`/api/solaredge/export-csv`, {
      params: { siteId, startDate, endDate },
      responseType: "blob",
    }),
};
