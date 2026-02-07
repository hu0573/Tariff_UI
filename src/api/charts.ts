import client from "./client";

export interface DemandSeriesItem {
  start_utc: number;
  max_kva: number;
  max_kva_utc: number;
}

export interface DemandSummary {
  peak_demand_kva: number;
  peak_demand_time_utc: number | null;
  estimated_charge: number;
  billing_days: number;
}

export interface DemandHeatmapMeta {
  timezone: string;
  demand_name: string;
  period_start_utc: number;  // UTC timestamp (seconds)
  period_end_utc: number;    // UTC timestamp (seconds)
  demand_id?: number;
}

export interface DemandHeatmapResponse {
  daily_series: DemandSeriesItem[];
  summary: DemandSummary;
  meta: DemandHeatmapMeta;
  estimated_charge?: number;
}

export interface DemandHeatmapData {
  [year: string]: {
    [month: string]: {
      [day: string]: number;
    };
  };
}

export interface DemandRuleStatistics {
  peak_value: number;
  peak_time_utc: number | null;
  peak_time_local?: string;
  average_value: number;
  total_days: number;
  days_above_90_percent: number;
  high_demand_days?: string[];
  est_monthly_charge?: number;
}



export interface DemandRuleData {
  rule_config: any; // Original demand rule config
  heatmap_data: DemandHeatmapData;
  statistics: DemandRuleStatistics;
}

export interface DemandAnalysisResponse {
  demand_rules: DemandRuleData[];
  scheme_info: any;
  nmi: string;
  timezone: string;
}


export interface GetDemandHeatmapParams {
  nmi: string;
  demand_id: number;
  start_utc_timestamp?: number;
  end_utc_timestamp?: number;
  is_relative_time?: boolean;
  relative_time?: string;
  state?: string;
  timezone?: string;
}

export interface GetDemandAnalysisParams {
    nmi: string;
    start_utc_timestamp?: number;
    end_utc_timestamp?: number;
    is_relative_time?: boolean;
    relative_time?: string;
    state?: string;
    timezone?: string;
}

export interface DynamicPriceDailyItem {
  timestamp_utc: number;
  amount: number;
}

export interface DynamicPriceSummary {
  monthly_totals: Record<string, number>;
  min_amount: number;
  max_amount: number;
}

export interface DynamicPriceMeta {
  nmi: string;
  direction: string;
  timezone: string;
}

export interface DynamicPriceDailyResponse {
  daily_data: DynamicPriceDailyItem[];
  summary: DynamicPriceSummary;
  meta: DynamicPriceMeta;
}

export type PriceDirection = "Input" | "Output";

export interface GetDynamicPriceDailyParams {
  nmi: string;
  direction: PriceDirection;
  is_relative_time?: boolean;
  relative_time?: string;
  start_utc_timestamp?: number;
  end_utc_timestamp?: number;
  state?: string;
  timezone?: string;
}

export interface V2Response<T> {
  success: boolean;
  data: T;
  meta?: any;
}

export const chartsApi = {
  getDemandHeatmap: (params: GetDemandHeatmapParams) =>
    client.get<DemandHeatmapResponse & { success: boolean }>("/api/v2/charts/demand-analysis/heatmap", { params }),
  getDemandAnalysis: (params: GetDemandAnalysisParams) =>
    client.get<V2Response<DemandAnalysisResponse>>("/api/v2/charts/demand-analysis/all", { params }),
  getDynamicPriceDaily: (params: GetDynamicPriceDailyParams) =>
    client.get<V2Response<DynamicPriceDailyResponse>>("/api/v2/charts/dynamic-price/daily", { params }),
};
