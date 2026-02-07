export interface BillingChartDatum {
  date: string;
  label: string;
  spot_market_buy: number;
  spot_market_sell: number;
  [key: string]: string | number;
}

export interface BillingSummary {
  total_spot_market_buy: number;
  total_spot_market_sell: number;
  net_spot_market_cost: number;
  total_demand_charge: number;
  total_period_charge: number;
  total_cost_excl_gst: number;
  total_cost_incl_gst: number;
  days_in_period: number;
  average_daily_cost: number;
  start_date?: string;
  end_date?: string;
  daily_breakdown?: any[];
  
  // New breakdown fields
  // New breakdown fields
  period_breakdown?: PeriodBreakdownItem[];
  demand_breakdown?: DemandBreakdownItem[];
  additional_breakdown?: AdditionalBreakdownItem[];
  total_spot_market_buy_kwh?: number;
  total_spot_market_sell_kwh?: number;
  total_additional_charges?: number;
  gst_amount?: number;
  dynamic_pricing_formula?: string;
}

export interface PeriodBreakdownItem {
  label: string;
  amount: number;
  total_kwh?: number;
  rate?: number;
}

export interface DemandBreakdownItem {
  label: string;
  amount: number;
  description?: string;
  max_kva?: number;
  rate?: number;
  rate_unit?: string;
}

export interface AdditionalBreakdownItem {
  label: string;
  amount: number;
  description?: string;
  billing_detail?: string;
}


export interface BillingParameterPanelProps {
  nmi: string;
  selectedYear: number;
  selectedMonth: number;
  isRelativeTime: boolean;
  relativeOption: string;
  selectedState: string;
  availableYears: number[];
  nmiItems: any[];
  isLoadingNMI: boolean;
  onNmiChange: (nmi: string) => void;
  onYearChange: (year: number) => void;
  onMonthChange: (month: number) => void;
  onRelativeTimeToggle: (enabled: boolean) => void;
  onRelativeOptionChange: (option: string) => void;
  onStateChange: (state: string) => void;
}

export interface BillingChartSectionProps {
  chartData: BillingChartDatum[];
  barKeys: Array<{ key: string; label: string; color: string }>;
  rangeDisplay: { start: string; end: string } | null;
  isLoading: boolean;
  isPrintMode: boolean;
}

export interface BillingSummaryTableProps {
  summary: BillingSummary;
  rangeDisplay: { start: string; end: string } | null;
  state: string;
}

export interface BillingBreakdownTableProps {
  data: BillingChartDatum[];
  // If we want sorting in future, add handlers here
  periodNames: string[];
  demandNames: string[];
  pricingPeriodKeyMap: Record<string, string>;
  demandKeyMap: Record<string, string>;
}

export interface BillingExportActionsProps {
  onCopyConfig: () => void;
  onExportPDF: () => void;
  onExportCSV: () => void;
  isExportingPDF: boolean;
  isExportingCSV: boolean;
  copySuccess: boolean;
  hasData: boolean;
}
