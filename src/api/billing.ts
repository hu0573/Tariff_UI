// Billing calculation API client

export interface BillingCalculationRequest {
  nmi: string;
  start_utc_timestamp?: number;
  end_utc_timestamp?: number;
  year?: number;
  month?: number;
  is_relative_time?: boolean;
  relative_time?: string;
  state?: string;
}

export interface DemandCharge {
  name: string;
  amount: number;
  max_demand_kva?: number;
}

export interface PeriodPricingBreakdown {
  weekday: number;
  weekend: number;
  total: number;
  by_period?: Record<string, number>;
}

export interface BillingDailyBreakdown {
  timestamp_utc: number;
  dynamic_pricing: number;
  spot_market_buy: number;
  spot_market_sell: number;
  period_pricing: PeriodPricingBreakdown;
  demand_charges: DemandCharge[];
  total: number;
}

export interface AdditionalCostBreakdown {
  name: string;
  type: string;
  amount: number;
  total_cost: number;
  is_gst_exempt: boolean;
}

export interface BillingSummary {
  usage_charges: number; // Renamed/grouped from period_pricing total
  demand_charges: number | DemandCharge[]; // Total demand charges or detailed array
  show_demand_charges?: DemandCharge[]; // Optional detail
  additional_charges: number;
  total_ex_gst: number;
  gst: number;
  total_inc_gst: number;
  
  // New fields for Spot Market
  spot_market_buy: number;
  spot_market_sell: number;

  // Legacy support or extra detail
  dynamic_pricing: number;
  period_pricing: PeriodPricingBreakdown;
  demand_charge_details: DemandCharge[]; // Renamed from demand_charges to avoid confusion with the number field
}

export interface BillingWarning {
  type: "channel_mapping_required" | "demand_calculation_error";
  demand_name: string;
  message: string;
  nmi?: string;
}

export interface BillingCalculationResponse {
  daily_breakdown: BillingDailyBreakdown[];
  summary: BillingSummary;
  breakdown: {
    additional_costs: AdditionalCostBreakdown[];
  };
  warnings?: BillingWarning[];
}

export interface EnergyConsumptionRequest {
  nmi: string;
  start_utc_timestamp?: number;
  end_utc_timestamp?: number;
  year?: number;
  month?: number;
  is_relative_time?: boolean;
  relative_time?: string;
  state?: string;
}

export interface EnergyDailyRecord {
  timestamp_utc: number;
  total_consumption: number;
  period_consumption: Record<string, number>;
  is_weekday: boolean;
  is_weekend: boolean;
  is_holiday: boolean;
}

export interface EnergySummaryItem {
  name: string;
  value: number;
  percentage: number;
}

export interface EnergyConsumptionResponse {
  daily_data: EnergyDailyRecord[];
  summary: EnergySummaryItem[];
  total_consumption: number;
  unit: string;
  enabled_channels: string[];
  missing_channels?: string[];
  warnings?: string[];
  scheme_info: {
    id: number;
    name: string;
    enable_weekday_pricing: boolean;
  };
  weekday_summary?: EnergySummaryItem[];
  weekend_summary?: EnergySummaryItem[];
  weekday_total?: number;
  weekend_total?: number;
}



export interface V2EnergyCharge {
  period: string;
  kwh: number;
  rate: number;
  cost: number;
}

export interface V2DemandCharge {
  name: string;
  max_kva: number;
  rate: number;
  rate_unit?: string;
  cost: number;
}

export interface V2DailyUsageItem {
  timestamp_utc: number;
  usage_by_period: Record<string, number>;
  cost_by_period: Record<string, number>;
  total_kwh: number;
  total_cost: number;
  spot_market_buy: number;
  spot_market_sell: number;
  demand_costs: Record<string, number>;
}

export interface V2AdditionalCostCharge {
  name: string;
  type: string;
  amount: number;
  total_cost: number;
  is_gst_exempt: boolean;
  description?: string;
  billing_detail?: string;
}

export interface V2SpotMarketData {
  market_price_trading_import_as_cost: number;
  market_price_trading_export_as_cost: number;
  net_cost: number;
  total_kwh_buy?: number;
  total_kwh_sell?: number;
  is_loss_factor_missing?: boolean;
  missing_financial_year?: number | null;
  scheme_id?: number | null;
  formula_display?: string;
}

export interface V2BillingResponse {
  success: boolean;
  data: {
    energy_charges: V2EnergyCharge[];
    demand_charges: V2DemandCharge[];
    additional_charges: V2AdditionalCostCharge[];
    spot_market: V2SpotMarketData;
    total_energy_cost: number;
    total_demand_cost: number;
    total_additional_cost: number;
    total_cost_ex_gst: number;
    gst: number;
    total_cost_inc_gst: number;
    daily_usage: V2DailyUsageItem[];
  };
  meta: {
    nmi: string;
    timezone: string;
    pricing_scheme_name?: string;
  };
}

export interface EnergyExportResponse {
  daily_data: {
    timestamp_utc: number;
    export: number;
    revenue: number;
    is_weekend: boolean;
    is_holiday: boolean;
  }[];
  summary: {
    total_export: number;
    total_revenue: number;
    daily_avg_export: number;
    daily_avg_revenue: number;
    total_days: number;
  };
  unit?: string;
  scheme_info?: {
    id: number;
    name: string;
  };
  status?: string;
  message?: string;
}
export interface V2Response<T> {
  success: boolean;
  data: T;
  meta: {
    nmi: string;
    timezone: string;
  };
}

import { generateMockBillingData } from "./mockData";

export const billingApi = {
  calculateBilling: async (data: BillingCalculationRequest) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    // Generate mock data based on parameters
    const mockData = generateMockBillingData(
      data.nmi, 
      data.state || "SA", 
      data.year || 2024, 
      data.month || 1
    );

    return {
      data: {
        success: true,
        data: mockData,
        meta: {
          nmi: data.nmi,
          timezone: "Australia/Adelaide",
          pricing_scheme_name: "Mock Tariff Scheme"
        }
      } as V2BillingResponse
    };
  },
  
  getEnergyConsumption: async (_data: EnergyConsumptionRequest) => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    // Simplified energy consumption mock
    return { 
      data: {
        daily_data: [],
        summary: [],
        total_consumption: 0,
        unit: "kWh",
        enabled_channels: ["E1"],
        scheme_info: { id: 1, name: "Mock Scheme", enable_weekday_pricing: false }
      } as EnergyConsumptionResponse
    };
  },
  
  getEnergyExport: async (_data: EnergyConsumptionRequest) => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return {
      data: {
        daily_data: [],
        summary: {
           total_export: 0,
           total_revenue: 0,
           daily_avg_export: 0,
           daily_avg_revenue: 0,
           total_days: 0
        }
      } as EnergyExportResponse
    };
  },
};
