// Pricing Schemes API functions
import { mockPricingSchemes } from "./mockData";

// Type definitions based on backend API
export interface PricingScheme {
  id: number;
  name: string;
  state?: string;
  enable_weekday_pricing: boolean;
  description?: string;
  enable_spot_market_buy: boolean;
  enable_spot_market_sell: boolean;
  gst_rate?: number;
  nmi_count: number;
  period_count: number;
  created_at: string;
  updated_at: string;
}

export interface PricingPeriod {
  id: number;
  name: string;
  start_time: string;
  end_time: string;
  price: number;
  period_group: 0 | 1 | 2;
  group_text?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PricingAdditionalCost {
  id?: number;
  scheme_id?: number;
  name: string;
  cost_type: "per_kwh" | "per_day" | "per_month" | "per_year";
  amount: number;
  is_gst_exempt: boolean;
  description?: string;
}

export interface Demand {
  id: number;
  scheme_id: number;
  name: string;
  description?: string;
  start_time: string;
  end_time: string;
  start_month: number;
  end_month: number;
  lookback_days: number;
  price_base: number;
  weekday_pricing: "all_days" | "weekday" | "weekend";
  sampling_method: "maximum_interval" | "daily_window_average";
  created_at?: string;
  updated_at?: string;
}

export interface LossFactor {
  scheme_id: number;
  financial_year: number;
  dlf: number;
  tlf: number;
  markup_type?: "none" | "percentage" | "per_kwh";
  markup_value?: number;
}

export interface PricingSchemeDetail
  extends Omit<PricingScheme, "nmi_count" | "period_count"> {
  state: string;
  enable_spot_market_buy: boolean;
  enable_spot_market_sell: boolean;
  gst_rate: number;
  periods: PricingPeriod[];
  additional_costs: PricingAdditionalCost[];
  nmis: NMIMeter[];
  demands: Demand[];
  loss_factors: LossFactor[];
}

export interface NMIMeter {
  nmi: string;
  name?: string;
  description?: string;
  address?: string;
  business_name?: string;
  company?: string;
  suburb?: string;
  postcode?: string;
  meter_type?: string;
  meter_type_desc?: string;
}

// Request/Response types
export interface CreatePricingSchemeRequest {
  name: string;
  state: string;
  enable_weekday_pricing: boolean;
  description?: string;
  enable_spot_market_buy?: boolean;
  enable_spot_market_sell?: boolean;
  gst_rate?: number;
  additional_costs?: PricingAdditionalCost[];
}

export interface UpdatePricingSchemeRequest {
  name?: string;
  state?: string;
  enable_weekday_pricing?: boolean;
  description?: string;
  enable_spot_market_buy?: boolean;
  enable_spot_market_sell?: boolean;
  gst_rate?: number;
  additional_costs?: PricingAdditionalCost[];
}

export interface CreatePricingPeriodRequest {
  name: string;
  start_time: string;
  end_time: string;
  price: number;
  period_group: 0 | 1 | 2;
  description?: string;
}

export interface UpdatePricingPeriodRequest {
  name?: string;
  start_time?: string;
  end_time?: string;
  price?: number;
  period_group?: 0 | 1 | 2;
  description?: string;
}

export interface PricingSchemesListResponse {
  schemes: PricingScheme[];
  total: number;
  page: number;
  page_size: number;
}

export interface NMISearchResponse {
  nmis: NMIMeter[];
  total: number;
}

export interface BatchAddNMIRequest {
  nmis: string[];
}

export interface CreateDemandRequest {
  name: string;
  description?: string;
  start_time: string;
  end_time: string;
  start_month: number;
  end_month: number;
  lookback_days: number;
  price_base: number;
  weekday_pricing?: "all_days" | "weekday" | "weekend";
  sampling_method?: "maximum_interval" | "daily_window_average";
}

export interface UpdateDemandRequest {
  name?: string;
  description?: string;
  start_time?: string;
  end_time?: string;
  start_month?: number;
  end_month?: number;
  lookback_days?: number;
  price_base?: number;
  weekday_pricing?: "all_days" | "weekday" | "weekend";
  sampling_method?: "maximum_interval" | "daily_window_average";
}

// Initial State (Mock Data)
const LOCAL_SCHEMES_STORE = JSON.parse(JSON.stringify(mockPricingSchemes));

// API functions
export const pricingSchemesApi = {
  // Get pricing schemes list
  getPricingSchemes: async (page: number = 1, pageSize: number = 20) => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    return {
      data: {
        schemes: LOCAL_SCHEMES_STORE,
        total: LOCAL_SCHEMES_STORE.length,
        page,
        page_size: pageSize,
      } as PricingSchemesListResponse
    };
  },

  // Create new pricing scheme
  createPricingScheme: async (data: CreatePricingSchemeRequest) => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    const newId = Math.max(...LOCAL_SCHEMES_STORE.map((s: any) => s.id), 0) + 1;
    const now = new Date().toISOString();
    
    // @ts-ignore - aligning types briefly for mock
    const newScheme: PricingSchemeDetail = {
      id: newId,
      ...data,
      created_at: now,
      updated_at: now,
      // nmi_count excluded from Detail type
      // period_count excluded from Detail type
      // period_count: 0,
      periods: [],
      additional_costs: data.additional_costs || [],
      nmis: [],
      demands: [],
      loss_factors: [],
      state: data.state || "SA",
      enable_spot_market_buy: !!data.enable_spot_market_buy,
      enable_spot_market_sell: !!data.enable_spot_market_sell,
      gst_rate: data.gst_rate || 0.1,
    };
    
    LOCAL_SCHEMES_STORE.push(newScheme);
    return { data: newScheme };
  },

  // Get pricing scheme detail
  getPricingSchemeDetail: async (id: number) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const scheme = LOCAL_SCHEMES_STORE.find((s: any) => s.id === id);
    if (!scheme) throw { response: { status: 404, data: { detail: "Not found" } } };
    
    // cast to Detail to satisfy type (in real app, detail has more fields than list item, but here we share store)
    return { data: JSON.parse(JSON.stringify(scheme)) as PricingSchemeDetail };
  },

  // Update pricing scheme
  updatePricingScheme: async (id: number, data: UpdatePricingSchemeRequest) => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    const idx = LOCAL_SCHEMES_STORE.findIndex((s: any) => s.id === id);
    if (idx === -1) throw { response: { status: 404 } };
    
    LOCAL_SCHEMES_STORE[idx] = { ...LOCAL_SCHEMES_STORE[idx], ...data, updated_at: new Date().toISOString() };
    return { data: LOCAL_SCHEMES_STORE[idx] as unknown as PricingSchemeDetail };
  },

  // Delete pricing scheme
  deletePricingScheme: async (id: number) => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    const idx = LOCAL_SCHEMES_STORE.findIndex((s: any) => s.id === id);
    if (idx !== -1) LOCAL_SCHEMES_STORE.splice(idx, 1);
    return { data: { success: true } };
  },

  // Get periods for a scheme
  getPricingPeriods: async (schemeId: number) => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const scheme = LOCAL_SCHEMES_STORE.find((s: any) => s.id === schemeId);
    return { data: scheme ? (scheme as unknown as PricingSchemeDetail).periods || [] : [] };
  },

  // Add period to scheme
  addPricingPeriod: async (schemeId: number, data: CreatePricingPeriodRequest) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const scheme = LOCAL_SCHEMES_STORE.find((s: any) => s.id === schemeId) as unknown as PricingSchemeDetail;
    if (!scheme) throw { response: { status: 404 } };
    
    if (!scheme.periods) scheme.periods = [];
    const newPeriod = {
      id: Math.floor(Math.random() * 100000),
      ...data,
      created_at: new Date().toISOString()
    };
    scheme.periods.push(newPeriod);
    return { data: newPeriod };
  },

  // Update period
  updatePricingPeriod: async (periodId: number, data: UpdatePricingPeriodRequest) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    // Find period across all schemes
    for (const scheme of LOCAL_SCHEMES_STORE) {
      const s = scheme as unknown as PricingSchemeDetail;
      if (s.periods) {
        const pIdx = s.periods.findIndex((p: any) => p.id === periodId);
        if (pIdx !== -1) {
          s.periods[pIdx] = { ...s.periods[pIdx], ...data };
          return { data: s.periods[pIdx] };
        }
      }
    }
    throw { response: { status: 404 } };
  },

  // Delete period
  deletePricingPeriod: async (periodId: number) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    for (const scheme of LOCAL_SCHEMES_STORE) {
      const s = scheme as unknown as PricingSchemeDetail;
      if (s.periods) {
        const pIdx = s.periods.findIndex((p: any) => p.id === periodId);
        if (pIdx !== -1) {
          s.periods.splice(pIdx, 1);
          return { data: { success: true } };
        }
      }
    }
    return { data: { success: true } };
  },

  // Get NMIs associated with scheme
  getSchemeNMIs: async (schemeId: number) => {
     await new Promise((resolve) => setTimeout(resolve, 400));
     const scheme = LOCAL_SCHEMES_STORE.find((s: any) => s.id === schemeId) as unknown as PricingSchemeDetail;
     return { data: scheme?.nmis || [] };
  },

  // Add NMI to scheme
  addNMIToScheme: async (schemeId: number, nmi: string) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const scheme = LOCAL_SCHEMES_STORE.find((s: any) => s.id === schemeId) as unknown as PricingSchemeDetail;
    if (!scheme) throw { response: { status: 404 } };
    if (!scheme.nmis) scheme.nmis = [];
    scheme.nmis.push({ nmi, address: "Added via Demo" });
    return { data: { success: true } };
  },

  // Remove NMI from scheme
  removeNMIFromScheme: async (schemeId: number, nmi: string) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const scheme = LOCAL_SCHEMES_STORE.find((s: any) => s.id === schemeId) as unknown as PricingSchemeDetail;
    if (scheme && scheme.nmis) {
      scheme.nmis = scheme.nmis.filter((n: any) => n.nmi !== nmi);
    }
    return { data: { success: true } };
  },

  // Batch add NMIs to scheme
  batchAddNMIsToScheme: async (schemeId: number, data: BatchAddNMIRequest) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const scheme = LOCAL_SCHEMES_STORE.find((s: any) => s.id === schemeId) as unknown as PricingSchemeDetail;
    if (scheme) {
      if (!scheme.nmis) scheme.nmis = [];
      data.nmis.forEach(n => {
        if (!scheme.nmis.find((existing: any) => existing.nmi === n)) {
          scheme.nmis.push({ nmi: n, address: "Batch Added Info" });
        }
      });
    }
    return { data: { success: true } };
  },

  // Search available NMIs
  searchNMIs: async (query: string, _limit: number = 20) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return {
      data: {
        nmis: [
          { nmi: "1000000001", address: "123 Energy St, Solar City" },
          { nmi: "1000000002", address: "456 Power Lane, Battery Park" },
          { nmi: "1000000003", address: "789 Voltage Ave, Grid Town" }
        ].filter(n => n.nmi.includes(query) || (n.address && n.address.includes(query))),
        total: 3
      }
    };
  },

  // Get all NMI-scheme associations
  getAllNMIAssociations: async () => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const associations: Record<string, any> = {};
    LOCAL_SCHEMES_STORE.forEach((scheme: any) => {
      const s = scheme as unknown as PricingSchemeDetail;
      s.nmis?.forEach((n: any) => {
        associations[n.nmi] = { scheme_id: s.id, scheme_name: s.name };
      });
    });
    return { data: associations };
  },

  // Demand CRUD
  getDemands: async (schemeId: number) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const scheme = LOCAL_SCHEMES_STORE.find((s: any) => s.id === schemeId) as unknown as PricingSchemeDetail;
    return { data: scheme?.demands || [] };
  },

  createDemand: async (schemeId: number, data: CreateDemandRequest) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const scheme = LOCAL_SCHEMES_STORE.find((s: any) => s.id === schemeId) as unknown as PricingSchemeDetail;
    if (!scheme) throw { response: { status: 404 } };
    if (!scheme.demands) scheme.demands = [];
    
    const newDemand = {
      id: Math.floor(Math.random() * 100000),
      scheme_id: schemeId,
      ...data,
      created_at: new Date().toISOString()
    } as Demand; 
    
    scheme.demands.push(newDemand);
    return { data: newDemand };
  },

  updateDemand: async (demandId: number, data: UpdateDemandRequest) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    for (const scheme of LOCAL_SCHEMES_STORE) {
      const s = scheme as unknown as PricingSchemeDetail;
      if (s.demands) {
        const dIdx = s.demands.findIndex((d: any) => d.id === demandId);
        if (dIdx !== -1) {
          s.demands[dIdx] = { ...s.demands[dIdx], ...data };
          return { data: s.demands[dIdx] };
        }
      }
    }
    throw { response: { status: 404 } };
  },

  deleteDemand: async (demandId: number) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    for (const scheme of LOCAL_SCHEMES_STORE) {
      const s = scheme as unknown as PricingSchemeDetail;
      if (s.demands) {
        const dIdx = s.demands.findIndex((d: any) => d.id === demandId);
        if (dIdx !== -1) {
          s.demands.splice(dIdx, 1);
          return { data: { success: true } };
        }
      }
    }
    return { data: { success: true } };
  },

  // Loss Factor CRUD
  addLossFactor: async (schemeId: number, data: any) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const scheme = LOCAL_SCHEMES_STORE.find((s: any) => s.id === schemeId) as unknown as PricingSchemeDetail;
    if (!scheme) throw { response: { status: 404 } };
    if (!scheme.loss_factors) scheme.loss_factors = [];
    
    const newLF = { scheme_id: schemeId, ...data };
    scheme.loss_factors.push(newLF);
    return { data: newLF };
  },

  updateLossFactor: async (schemeId: number, year: number, data: any) => {
     await new Promise((resolve) => setTimeout(resolve, 500));
     const scheme = LOCAL_SCHEMES_STORE.find((s: any) => s.id === schemeId) as unknown as PricingSchemeDetail;
     if (scheme && scheme.loss_factors) {
       const lfIdx = scheme.loss_factors.findIndex((l: any) => l.financial_year === year);
       if (lfIdx !== -1) {
         scheme.loss_factors[lfIdx] = { ...scheme.loss_factors[lfIdx], ...data };
       }
     }
     return { data: undefined };
  },

  deleteLossFactor: async (schemeId: number, year: number) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const scheme = LOCAL_SCHEMES_STORE.find((s: any) => s.id === schemeId) as unknown as PricingSchemeDetail;
    if (scheme && scheme.loss_factors) {
      scheme.loss_factors = scheme.loss_factors.filter((l: any) => l.financial_year !== year);
    }
    return { data: undefined };
  }
};
