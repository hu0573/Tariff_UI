// Channel Mapping API functions
import apiClient from "./client";

// Type definitions based on backend API
export interface PowerMetric {
  id: number;
  code: string;
  name: string;
  description?: string;
}


export interface ChannelMappingItem {
  channel: string;
  series: string;
  description?: string;
  power_metrics_id?: number | null;
  status?: "active" | "unused" | "unregistered";
}

export interface ChannelMappingDetail {
  nmi: string;
  site_name?: string;
  description?: string;
  channels: ChannelMappingItem[];
}

export interface ChannelStatusItem {
  channel: string;
  series: string;
  status: "active" | "unused" | "unregistered";
  description: string;
  total_records: number;
  non_null_records: number;
  non_zero_records: number;
}

export interface ChannelStatusResponse {
  nmi: string;
  check_period_days: number;
  channels: ChannelStatusItem[];
}

export interface MonitoredNMIItem {
  nmi: string;
  name: string;
  address: string;
  suburb: string;
  state: string;
  postcode: string;
  refresh_frequency: "daily" | "weekly" | "monthly";
  has_historical_data: boolean;
  has_channel_mapping: boolean;
  latest_reading_timestamp: number | null;
}

export interface MonitoredNMIsResponse {
  success: boolean;
  data: MonitoredNMIItem[];
  total: number;
}

export interface ChannelMappingListResponse {
  success: boolean;
  data: Array<{
    nmi: string;
    site_name?: string;
    channel_count: number;
    created_at: string;
    updated_at: string;
  }>;
  total: number;
}

export interface ChannelMappingDetailResponse {
  success: boolean;
  data: ChannelMappingDetail;
}

export interface ChannelMappingUpdateRequest {
  description?: string;
  channels: ChannelMappingItem[];
}

export interface ChannelMappingUpdateResponse {
  success: boolean;
  message: string;
  data: {
    nmi: string;
    updated_channels: number;
  };
}

export interface PowerMetricsResponse {
  success: boolean;
  data: PowerMetric[];
}


export interface ChannelStatusResponseData {
  success: boolean;
  data: ChannelStatusResponse;
}

// Channel Mapping error type
export interface ChannelMappingError {
  error: "CHANNEL_MAPPING_NOT_FOUND";
  message: string;
  nmi: string;
  suggestion: string;
}

export interface BulkInitializeResponse {
  success: boolean;
  message: string;
  data: {
    initialized_count: number;
    failed_count: number;
    failed_nmis: Array<{ nmi: string; reason: string }>;
  };
}

// API functions
export const channelMappingApi = {
  // Get monitored NMIs
  getMonitoredNMIs: () =>
    apiClient.get<MonitoredNMIsResponse>(
      "/api/channel-mappings/monitored-nmis"
    ),

  // Bulk initialize channel mappings
  bulkInitialize: () =>
    apiClient.post<BulkInitializeResponse>(
      "/api/channel-mappings/bulk-initialize"
    ),

  // Get all channel mappings
  getAllMappings: () =>
    apiClient.get<ChannelMappingListResponse>("/api/channel-mappings"),

  // Get channel mapping by NMI
  getMappingByNMI: (nmi: string) =>
    apiClient.get<ChannelMappingDetailResponse>(
      `/api/channel-mappings/${nmi}`
    ),

  // Create or update channel mapping
  createOrUpdateMapping: (nmi: string, data: ChannelMappingUpdateRequest) =>
    apiClient.post<ChannelMappingUpdateResponse>(
      `/api/channel-mappings/${nmi}`,
      data
    ),

  // Delete channel mapping
  deleteMapping: (nmi: string) =>
    apiClient.delete(`/api/channel-mappings/${nmi}`),

  // Get power metrics options
  getPowerMetricsOptions: () =>
    apiClient.get<PowerMetricsResponse>("/api/power-metrics"),


  // Get channel status for NMI
  getChannelStatus: (nmi: string) =>
    apiClient.get<ChannelStatusResponseData>(
      `/api/channel-mappings/${nmi}/channel-status`
    ),
};
