
// Mock data for the Tariff UI Demo
// This file contains all the static data used to simulate the API responses.

export const MOCK_DELAY = 600; // Simulated network delay in ms

// --- Pricing Schemes Mock Data ---

export const mockPricingSchemes = [
  {
    id: 1,
    name: "for NMI 1000000001",
    state: "SA",
    enable_weekday_pricing: true,
    description: "",
    enable_spot_market_buy: true,
    enable_spot_market_sell: true,
    gst_rate: 0.1,
    nmi_count: 1,
    period_count: 4,
    created_at: "2025-01-15T10:00:00Z",
    updated_at: "2025-06-20T14:30:00Z",
    periods: [
      {
        id: 101,
        name: "Off Peak",
        start_time: "00:00",
        end_time: "07:00",
        price: 0.0599,
        period_group: 1, // Weekday
        description: "",
      },
      {
        id: 102,
        name: "Peak",
        start_time: "07:00",
        end_time: "21:00",
        price: 0.0958,
        period_group: 1, // Weekday
        description: "",
      },
      {
        id: 103,
        name: "Off Peak",
        start_time: "21:00",
        end_time: "24:00",
        price: 0.0599,
        period_group: 1, // Weekday
        description: "",
      },
      {
        id: 104,
        name: "Off Peak",
        start_time: "00:00",
        end_time: "24:00",
        price: 0.0599,
        period_group: 2, // Weekend
        description: "",
      },
    ],
    nmis: [
      { nmi: "1000000001", address: "123 Energy St, Solar City SA 5000" },
    ],
    loss_factors: [
      {
        financial_year: 2025,
        dlf: 0.062,
        tlf: -0.0172,
        markup_type: "percentage",
        markup_value: 0.10,
      }
    ],
    demands: [
      {
        id: 1,
        scheme_id: 1,
        name: "Anytime",
        start_time: "00:00",
        end_time: "24:00", // Full day
        start_month: 1,
        end_month: 12,
        lookback_days: 365,
        price_base: 0.0600,
        weekday_pricing: "all_days",
        sampling_method: "maximum_interval", 
        // Note: frontend might map 'maximum_interval' to "Maximum Interval Value" display
      },
      {
        id: 2,
        scheme_id: 1,
        name: "Peak Demand",
        start_time: "17:00",
        end_time: "21:00",
        start_month: 11,
        end_month: 3, // Cross-year range if logic supports it, or simple display
        lookback_days: 31,
        price_base: 1.1100,
        weekday_pricing: "all_days",
        sampling_method: "daily_window_average",
      }
    ],
    additional_costs: [
      {
        id: 1,
        name: "Ancillary Services",
        cost_type: "per_kwh_excl_loss", // Assuming backend/type mapping supports this
        amount: 0.0019,
        is_gst_exempt: false,
        description: "Optional"
      },
      {
        id: 2,
        name: "AEMO UFE Charge",
        cost_type: "per_kwh_excl_loss",
        amount: 0.002,
        is_gst_exempt: false,
        description: "Optional"
      },
      {
        id: 3,
        name: "SA REPS Charge",
        cost_type: "per_kwh_excl_loss",
        amount: 0.0033,
        is_gst_exempt: false,
        description: "Optional"
      },
      {
        id: 4,
        name: "LRET Charge",
        cost_type: "per_kwh_excl_loss",
        amount: 0.00706,
        is_gst_exempt: false,
        description: "Optional"
      },
      {
        id: 5,
        name: "AEMO Pool Charge",
        cost_type: "per_kwh_excl_loss",
        amount: 0.00055,
        is_gst_exempt: false,
        description: "Optional"
      },
      {
        id: 6,
        name: "Service and Admin Charge",
        cost_type: "per_day",
        amount: 3.4,
        is_gst_exempt: false,
        description: "Optional"
      },
      {
        id: 7,
        name: "Standing Charge",
        cost_type: "per_day",
        amount: 8.219999,
        is_gst_exempt: false,
        description: "Optional"
      },
      {
        id: 8,
        name: "Meter Charge",
        cost_type: "per_year", // Assuming simple 'per_year' or handled as fixed cost
        amount: 1144.999999,
        is_gst_exempt: false,
        description: "Optional"
      }
    ]
  },
  {
    id: 2,
    name: "Commercial Demand Tariff",
    state: "VIC",
    enable_weekday_pricing: false,
    description: "Commercial tariff with demand charges",
    enable_spot_market_buy: true,
    enable_spot_market_sell: false,
    gst_rate: 0.1,
    nmi_count: 2,
    period_count: 3,
    created_at: "2023-02-10T09:00:00Z",
    updated_at: "2023-07-01T11:20:00Z",
     periods: [
      {
        id: 201,
        name: "Peak",
        start_time: "07:00",
        end_time: "19:00",
        price: 0.35,
        period_group: 0, // General
        description: "Business hours",
      },
      {
        id: 202,
        name: "Off-Peak",
        start_time: "19:00",
        end_time: "07:00",
        price: 0.18,
        period_group: 0, 
        description: "Overnight",
      }
    ],
    nmis: [
       { nmi: "1000000003", address: "789 Voltage Ave, Grid Town VIC 3000" }
    ],
    demands: [
      {
        id: 1,
        scheme_id: 2,
        name: "KVA Demand",
        start_time: "10:00",
        end_time: "18:00",
        start_month: 1,
        end_month: 12,
        lookback_days: 0,
        price_base: 0.15,
        weekday_pricing: "weekday",
        sampling_method: "maximum_interval",
      }
    ],
    loss_factors: [],
    additional_costs: [
      {
        id: 1,
        name: "Supply Charge",
        cost_type: "per_day",
        amount: 1.25,
        is_gst_exempt: false,
        description: "Regular supply charge"
      }
    ]
  }
];

// --- Billing Calculation Mock Data ---

export const generateMockBillingData = (nmi: string, state: string, year: number | null, month: number | null) => {
  // Deterministic random based on inputs
  const seed = (str: string) => {
    let h = 0xdeadbeef;
    for (let i = 0; i < str.length; i++) {
        h = Math.imul(h ^ str.charCodeAt(i), 2654435761);
    }
    return ((h ^ h >>> 16) >>> 0);
  };
  
  const rngKey = `${nmi}-${state}-${year}-${month}`;
  let seedVal = seed(rngKey);
  const rand = () => {
    seedVal = Math.imul(seedVal, 1664525) + 1013904223 | 0;
    return (seedVal >>> 0) / 4294967296;
  };

  const daysInMonth = month ? new Date(year || 2024, month, 0).getDate() : 30;
  const days = [];
  
  for (let i = 1; i <= daysInMonth; i++) {
    const dailyKwh = 10 + rand() * 40; // 10-50 kWh
    const spotPrice = 0.05 + rand() * 0.30;
    const cost = dailyKwh * 0.25; // simplified
    
    // Create consistent UTC timestamps for "local" days
    // Assuming UTC is roughly local time - 10h for simplicity in mock
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(i).padStart(2, '0')} 00:00:00`;
    const ts = Math.floor(new Date(dateStr).getTime() / 1000);

    days.push({
      timestamp_utc: ts,
      local_date: dateStr.split(" ")[0],
      total_kwh: dailyKwh, // Renamed from kwh
      total_cost: cost,    // Added total_cost
      spot_market_buy: dailyKwh * spotPrice,
      spot_market_sell: (dailyKwh * 0.5) * (spotPrice * 0.8), 
      cost_by_period: {
        "Peak": cost * 0.7,
        "Off-Peak": cost * 0.3
      },
      usage_by_period: { // Added usage_by_period
        "Peak": dailyKwh * 0.4,
        "Off-Peak": dailyKwh * 0.6
      },
      demand_costs: {
        "KVA Demand": rand() > 0.8 ? 5.0 : 0 
      }
    });
  }

  // Summaries
  const totalKwh = days.reduce((acc, d) => acc + d.total_kwh, 0);
  const totalCost = days.reduce((acc, d) => acc + Object.values(d.cost_by_period).reduce((a: number, b: number) => a + b, 0), 0);
  
  return {
    spot_market: {
      market_price_trading_import_as_cost: totalCost * 0.8,
      total_kwh_buy: totalKwh,
      market_price_trading_export_as_cost: totalCost * 0.2,
      total_kwh_sell: totalKwh * 0.5,
      net_cost: totalCost * 0.6,
      formula_display: "Spot Price + Risk Margin",
      is_loss_factor_missing: false,
    },
    total_demand_cost: 50.0,
    total_energy_cost: totalCost,
    total_cost_ex_gst: totalCost + 50.0 + 30.0, // + additional
    total_cost_inc_gst: (totalCost + 50.0 + 30.0) * 1.1,
    gst: (totalCost + 50.0 + 30.0) * 0.1,
    days_in_period: daysInMonth,
    daily_usage: days,
    energy_charges: [
       { period: "Peak", cost: totalCost * 0.7, kwh: totalKwh * 0.4, rate: 0.35 },
       { period: "Off-Peak", cost: totalCost * 0.3, kwh: totalKwh * 0.6, rate: 0.15 }
    ],
    demand_charges: [
       { name: "KVA Demand", cost: 50.0, max_kva: 120, rate: 1.5, rate_unit: "$/kVA/month" }
    ],
    additional_charges: [
       { 
         name: "Supply Charge", 
         type: "per_day", // Added type
         amount: 1.00,    // Added amount (rate)
         total_cost: 30.0, 
         is_gst_exempt: false, 
         billing_detail: "30 days @ $1.00/day" 
       }
    ],
    total_additional_cost: 30.0
  };
};

// --- Config Mock Data ---

export const mockNMIList = [
  { nmi: "1000000001", customer_name: "John Doe", site_address: "123 Energy St, Solar City SA 5000", state: "SA" },
  { nmi: "1000000002", customer_name: "Jane Smith", site_address: "456 Power Lane, Battery Park SA 5045", state: "SA" },
  { nmi: "1000000003", customer_name: "Acme Corp", site_address: "789 Voltage Ave, Grid Town VIC 3000", state: "VIC" },
];

export const mockSAPNConfig = {
  username: "demo_user",
  password: "••••••••",
  api_key: "demo_key_123456",
  base_url: "https://api.sapowernetworks.com.au",
};
