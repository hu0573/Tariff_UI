import { useState, useMemo, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { billingApi } from "@/api/billing";
import { timeApi } from "@/api/time";
import { nmiDataApi } from "@/api/nmiData";
import { exportApi, pollExportTask } from "@/api/export";
import { useNMIList, useRefreshStrategy } from "@/hooks/useConfig";
import { timeRangeApi } from "@/api/timeRange";
import { toastManager } from "@/components/common/Toast";
import {
  copyConfig as copyChartConfig,
  createChartConfig,
} from "@/utils/chartShare";
import { type NMIItem } from "@/components/NMISelector";

// Components
import { BillingChartSection } from "./components/BillingChartSection";
import { BillingSummaryTable } from "./components/BillingSummaryTable";
import { BillingBreakdownTable } from "./components/BillingBreakdownTable";
import type {
  BillingChartDatum,
  BillingSummary,
} from "./BillingCalculation.types";

// Shared components & Hooks
import { useChartPageParams } from "../shared/hooks/useChartPageParams";
import { StandardChartContainer } from "../shared/components/StandardChartContainer";
import { StandardPageHeader } from "../shared/components/StandardPageHeader";
import { UnifiedParameterPanel } from "../shared/components/UnifiedParameterPanel";
import { PrintLogo } from "../shared/components/PrintLogo";
import { PrintParameterSummary } from "../shared/components/PrintParameterSummary";
import { NMIInfoCard } from "../shared/components/NMIInfoCard";
import { ScreenshotDivider } from "../shared/components/ScreenshotDivider";
import { NMISelector } from "../shared/components/NMISelector";
import { StateSelector } from "../shared/components/StateSelector";
import { RelativeTimeSelector } from "../shared/components/RelativeTimeSelector";
import { TimeRangeSelector } from "../shared/components/TimeRangeSelector";

// Local helper types
type MonitoredNMIItem = { nmi?: string; refresh_frequency?: string } | string;

const sanitizeKey = (name: string) => name.replace(/[^a-zA-Z0-9]/g, "_");

export default function BillingCalculation() {
  const {
    nmi: selectedNMI,
    setNmi: setSelectedNMI,
    state: selectedState,
    setState: setSelectedState,
    year: selectedYear,
    month: selectedMonth,
    isRelativeTime,
    setIsRelativeTime,
    relativeTime: relativeOption,
    setRelativeTime: setRelativeOption,
    isPrintMode,
    isChartMode,
    setParams,
  } = useChartPageParams<Record<string, any>>(undefined, {
    defaults: { isRelativeTime: true },
  });

  const absoluteMonth = useMemo(() => {
    return `${selectedYear}-${String(selectedMonth).padStart(2, "0")}`;
  }, [selectedYear, selectedMonth]);

  const setAbsoluteMonth = useCallback((val: string) => {
    const [y, m] = val.split("-").map(Number);
    setParams({
      year: y,
      month: m,
      is_relative_time: "false",
      relative_time: null,
    });
  }, [setParams]);

  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingCSV, setIsExportingCSV] = useState(false);

  // Fetch NMI list for info and monitoring logic
  const { data: nmiListData } = useNMIList();
  const { data: refreshStrategy } = useRefreshStrategy();

  const monitoredNMIMap = useMemo(() => {
    const map = new Map<string, string>();
    (refreshStrategy?.monitored_nmis || []).forEach(
      (item: MonitoredNMIItem) => {
        const nmi = typeof item === "string" ? item : item.nmi || String(item);
        const freq =
          typeof item === "string"
            ? "daily"
            : item.refresh_frequency || "daily";
        map.set(nmi, freq);
      }
    );
    return map;
  }, [refreshStrategy]);

  const sortedNMIs = useMemo(() => {
    const rawList = [...(((nmiListData as any)?.nmis || []) as NMIItem[])];
    const filtered = rawList
      .filter((nmi) => monitoredNMIMap.has(nmi.nmi))
      .sort((a, b) => a.nmi.localeCompare(b.nmi));
    return filtered;
  }, [nmiListData, monitoredNMIMap]);

  // Auto-select first NMI if none selected
  useEffect(() => {
    if (!selectedNMI && sortedNMIs.length > 0) {
      setSelectedNMI(sortedNMIs[0].nmi);
    }
  }, [selectedNMI, sortedNMIs, setSelectedNMI]);

  // Data Range Query - Get available year/month options
  const { data: dateRangeData } = useQuery({
    queryKey: ["nmi-date-range", selectedNMI, selectedState],
    queryFn: () => {
      if (!selectedNMI) return null;
      return nmiDataApi
        .getDateRange(selectedNMI, { state: selectedState })
        .then((res) => res.data);
    },
    enabled: !!selectedNMI,
  });

  const { data: availableTimes } = useQuery({
    queryKey: ["available-year-months", dateRangeData, selectedState],
    queryFn: async () => {
      if (!dateRangeData?.available_range) return null;

      const { start_utc_timestamp, end_utc_timestamp } =
        dateRangeData.available_range;

      const response = await timeApi.convertUtcToLocal({
        utc_timestamps: [start_utc_timestamp, end_utc_timestamp],
        state: selectedState,
      });

      if (!response.data.results || response.data.results.length < 2)
        return null;

      const startLocal = response.data.results[0].local_datetime;
      const endLocal = response.data.results[1].local_datetime;

      const [startYear, startMonth] = startLocal
        .split(" ")[0]
        .split("-")
        .map(Number);
      const [endYear, endMonth] = endLocal.split(" ")[0].split("-").map(Number);

      const years: number[] = [];
      for (let y = startYear; y <= endYear; y++) {
        years.push(y);
      }

      return {
        years,
        startYear,
        startMonth,
        endYear,
        endMonth,
      };
    },
    enabled: !!dateRangeData?.available_range,
  });

  const availableMonths = useMemo(() => {
    if (!availableTimes) return Array.from({ length: 12 }, (_, i) => i + 1);
    const { startYear, startMonth, endYear, endMonth } = availableTimes;

    const minMonth = selectedYear === startYear ? startMonth : 1;
    const maxMonth = selectedYear === endYear ? endMonth : 12;

    const months: number[] = [];
    for (let m = minMonth; m <= maxMonth; m++) {
      months.push(m);
    }
    return months;
  }, [availableTimes, selectedYear]);

  // Get selected NMI information for display
  const selectedNMIInfo = useMemo(() => {
    if (!selectedNMI || !sortedNMIs.length) return null;
    return sortedNMIs.find((nmi) => nmi.nmi === selectedNMI) || null;
  }, [selectedNMI, sortedNMIs]);

  // Relative Time Calculation
  const { data: serverTimeData } = useQuery({
    queryKey: ["server-time"],
    queryFn: () => timeApi.getCurrentTime(),
    refetchInterval: 300000,
  });

  const serverUtcTimestamp = serverTimeData?.data?.utc_timestamp;

  const { data: relativeTimeRange } = useQuery({
    queryKey: [
      "relative-time-range",
      relativeOption,
      serverUtcTimestamp,
      selectedState,
    ],
    queryFn: async () => {
      if (!serverUtcTimestamp) return null;

      if (relativeOption === "last_full_month") {
        const currentMonthRes = await timeApi.convertUtcToLocal({
          utc_timestamp: serverUtcTimestamp,
          state: selectedState,
        });
        const currentLocal = currentMonthRes.data;
        if (!currentLocal || !currentLocal.local_datetime) return null;

        const [datePart] = currentLocal.local_datetime.split(" ");
        const [year, month] = datePart.split("-").map(Number);

        let targetYear = year;
        let targetMonth = month - 1;
        if (targetMonth <= 0) {
          targetMonth = 12;
          targetYear -= 1;
        }

        const rangeRes = await timeRangeApi.getMonthRange({
          state: selectedState,
          year: targetYear,
          month: targetMonth,
        });

        return {
          ...rangeRes.data,
          targetYear,
          targetMonth,
        };
      } else if (relativeOption === "last_full_year") {
        const currentYearRes = await timeApi.convertUtcToLocal({
          utc_timestamp: serverUtcTimestamp,
          state: selectedState,
        });
        const currentLocal = currentYearRes.data;
        if (!currentLocal || !currentLocal.local_datetime) return null;

        const [datePart] = currentLocal.local_datetime.split(" ");
        const [year] = datePart.split("-").map(Number);

        const targetYear = year - 1;
        const rangeRes = await timeRangeApi.getYearRange({
          state: selectedState,
          year: targetYear,
        });

        return {
          ...rangeRes.data,
          targetYear,
          targetMonth: null,
        };
      }

      return null;
    },
    enabled: isRelativeTime && !!serverUtcTimestamp,
  });

  // Fetch explicit time range for absolute mode
  const { data: timeRange } = useQuery({
    queryKey: ["time-range-absolute", selectedState, selectedYear, selectedMonth],
    queryFn: async () => {
      const res = await timeRangeApi.getMonthRange({
        state: selectedState,
        year: selectedYear,
        month: selectedMonth,
      });
      return res.data;
    },
    enabled: !!selectedState && !isRelativeTime,
  });

  const effectiveTimeRange = isRelativeTime ? relativeTimeRange : timeRange;

  // Fetch billing calculation data
  const {
    data: result,
    isLoading: isBillingLoading,
    error: billingError,
  } = useQuery({
    queryKey: [
      "billing-calculation",
      selectedNMI,
      selectedState,
      isRelativeTime,
      isRelativeTime ? relativeOption : `${selectedYear}-${selectedMonth}`,
    ],
    queryFn: async () => {
      if (!selectedNMI) return null;
      const response = await billingApi.calculateBilling({
        nmi: selectedNMI,
        state: selectedState,
        is_relative_time: isRelativeTime,
        relative_time: isRelativeTime ? relativeOption : undefined,
        start_utc_timestamp: effectiveTimeRange?.start_utc_timestamp,
        end_utc_timestamp: effectiveTimeRange?.end_utc_timestamp,
      });
      return response.data;
    },
    enabled: !!selectedNMI && !!effectiveTimeRange,
  });

  // Derived Keys and Data from V2 Response
  const pricingPeriodNames = useMemo(() => {
    if (!result?.data?.energy_charges) return [];
    return result.data.energy_charges.map((ec) => ec.period);
  }, [result]);

  const demandNames = useMemo(() => {
    if (!result?.data?.demand_charges) return [];
    return result.data.demand_charges.map((dc) => dc.name);
  }, [result]);

  const demandKeyMap = useMemo(() => {
    const m: Record<string, string> = {};
    demandNames.forEach((n) => (m[n] = `demand_${sanitizeKey(n)}`));
    return m;
  }, [demandNames]);

  const pricingPeriodKeyMap = useMemo(() => {
    const m: Record<string, string> = {};
    pricingPeriodNames.forEach(
      (n) => (m[n] = `period_charge_${sanitizeKey(n)}`)
    );
    return m;
  }, [pricingPeriodNames]);

  // Batch convert timestamps for display labels
  const breakdownTimestamps = useMemo(() => {
    if (!result?.data?.daily_usage) return [];
    return result.data.daily_usage.map((day: any) => day.timestamp_utc);
  }, [result]);

  const { data: breakdownConversions, isLoading: isBreakdownLoading } = useQuery({
    queryKey: ["billing-breakdown-times", breakdownTimestamps, selectedState],
    queryFn: async () => {
      if (breakdownTimestamps.length === 0) return null;
      const response = await timeApi.convertUtcToLocal({
        utc_timestamps: breakdownTimestamps,
        state: selectedState,
      });
      return response.data;
    },
    enabled: breakdownTimestamps.length > 0 && !!selectedState,
    staleTime: Infinity,
  });

  const timestampDateMap = useMemo(() => {
    const map = new Map<number, { label: string; full: string }>();
    if (!breakdownConversions?.results) return map;
    breakdownConversions.results.forEach((res: any) => {
      const datePart = res.local_datetime.split(" ")[0]; // YYYY-MM-DD
      const [_, m, d] = datePart.split("-");
      map.set(res.utc_timestamp, {
        label: `${m}-${d}`,
        full: datePart,
      });
    });
    return map;
  }, [breakdownConversions]);

  const chartData: BillingChartDatum[] = useMemo(() => {
    if (!result?.data?.daily_usage) return [];
    
    return result.data.daily_usage.map((day) => {
      const timeInfo = timestampDateMap.get(day.timestamp_utc);
      const displayDate = timeInfo?.label || "...";
      
      const base: BillingChartDatum = {
        date: displayDate, // for internal labels/ordering
        fullDate: timeInfo?.full || "",
        label: displayDate,
        spot_market_buy: day.spot_market_buy || 0, 
        spot_market_sell: day.spot_market_sell || 0,
      };
      
      // Map energy costs by period
      Object.entries(day.cost_by_period).forEach(([period, cost]) => {
        const key = pricingPeriodKeyMap[period];
        if (key) {
          base[key] = Number(cost);
        }
      });
      
      // Map demand costs
      const demandCosts = day.demand_costs || {};
      demandNames.forEach((name) => {
        base[demandKeyMap[name]] = Number(demandCosts[name] || 0);
      });
      
      return base;
    });
  }, [
    result,
    pricingPeriodKeyMap,
    demandKeyMap,
    demandNames,
    timestampDateMap,
  ]);

  const barKeys = useMemo(
    () => [
      { key: "spot_market_buy", label: "Spot Market Buy", color: "#a855f7" },
      { key: "spot_market_sell", label: "Spot Market Sell", color: "#ef4444" },
      ...pricingPeriodNames.map((n, i) => ({
        key: pricingPeriodKeyMap[n],
        label: n,
        color: ["#22c55e", "#16a34a", "#15803d", "#14532d"][i % 4],
      })),
      ...demandNames.map((n, i) => ({
        key: demandKeyMap[n],
        label: n,
        color: ["#f97316", "#eab308", "#06b6d4", "#0ea5e9", "#f43f5e"][i % 5],
      })),
    ],
    [pricingPeriodNames, pricingPeriodKeyMap, demandNames, demandKeyMap]
  );

  const formatNumber = (num: number, decimals: number = 2) => {
    return num.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  const transformedSummary: BillingSummary | null = useMemo(() => {
    if (!result?.data) return null;

    const days = result.data.daily_usage?.length || 0;
    
    const periodBreakdown = (result.data.energy_charges || []).map((ec: any) => ({
      label: ec.period,
      amount: ec.cost,
      total_kwh: ec.kwh,
      rate: ec.rate
    }));

    const demandBreakdown = (result.data.demand_charges || []).map((dc: any) => ({
      label: dc.name,
      amount: dc.cost,
      max_kva: dc.max_kva,
      rate: dc.rate,
      rate_unit: dc.rate_unit,
      description: `${formatNumber(dc.max_kva, 2)} kVA (Rate: ${dc.rate.toFixed(4)} ${dc.rate_unit || '$/kVA/day'})`,
    }));

    const additionalBreakdown = (result.data.additional_charges || []).map((ac: any) => ({
      label: ac.name,
      amount: ac.total_cost,
      description: ac.is_gst_exempt ? "(GST Exempt)" : undefined,
      billing_detail: ac.billing_detail
    }));

    const totalEx = result.data.total_cost_ex_gst;
    const gst = result.data.gst;

    const firstDayTs = result.data.daily_usage[0]?.timestamp_utc;
    const lastDayTs = result.data.daily_usage[days - 1]?.timestamp_utc;

    return {
      total_spot_market_buy: result.data.spot_market.market_price_trading_import_as_cost,
      total_spot_market_buy_kwh: result.data.spot_market.total_kwh_buy,
      
      total_spot_market_sell: result.data.spot_market.market_price_trading_export_as_cost,
      total_spot_market_sell_kwh: result.data.spot_market.total_kwh_sell,

      net_spot_market_cost: result.data.spot_market.net_cost,
      total_demand_charge: result.data.total_demand_cost,
      total_period_charge: result.data.total_energy_cost,
      total_cost_excl_gst: totalEx,
      total_cost_incl_gst: result.data.total_cost_inc_gst,
      gst_amount: gst,
      days_in_period: days,
      average_daily_cost: days > 0 ? totalEx / days : 0,
      daily_breakdown: result.data.daily_usage, 
      period_breakdown: periodBreakdown,
      demand_breakdown: demandBreakdown,
      additional_breakdown: additionalBreakdown,
      total_additional_charges: result.data.total_additional_cost,
      start_date: firstDayTs ? timestampDateMap.get(firstDayTs)?.full : undefined,
      end_date: lastDayTs ? timestampDateMap.get(lastDayTs)?.full : undefined,
      dynamic_pricing_formula: result.data.spot_market?.formula_display,
    };
  }, [result, timestampDateMap]);

  const lossFactorWarning = useMemo(() => {
    if (!result?.data?.spot_market) return null;
    const { is_loss_factor_missing, missing_financial_year, scheme_id } = result.data.spot_market;
    if (is_loss_factor_missing) {
      return { missing_financial_year, scheme_id };
    }
    return null;
  }, [result]);

  const rangeDisplay = useMemo(() => {
    if (!transformedSummary?.start_date || !transformedSummary?.end_date)
      return null;
    return {
      start: transformedSummary.start_date,
      end: transformedSummary.end_date,
    };
  }, [transformedSummary]);

  const getCleanConfigParams = useCallback(() => {
    const params: Record<string, any> = {
      nmi: selectedNMI,
      state: selectedState,
      is_relative_time: isRelativeTime,
    };

    if (isRelativeTime) {
      params.relative_time = relativeOption;
      // Explicitly exclude absolute dates/timestamps
    } else {
      // Absolute mode
      params.year = selectedYear;
      params.month = selectedMonth;
      if (effectiveTimeRange) {
        params.start_utc_timestamp = effectiveTimeRange.start_utc_timestamp;
        params.end_utc_timestamp = effectiveTimeRange.end_utc_timestamp;
      }
    }
    return params;
  }, [
    selectedNMI,
    selectedState,
    isRelativeTime,
    relativeOption,
    selectedYear,
    selectedMonth,
    effectiveTimeRange,
  ]);

  const handleExportPDF = useCallback(async () => {
    if (!selectedNMI) return;
    try {
      setIsExportingPDF(true);
      const chartConfig = createChartConfig({
        chartType: "billing_calculation",
        chartName: "Billing Calculation",
        path: "/tables-charts/billing-calculation",
        params: getCleanConfigParams(),
      });

      const { data } = await exportApi.createPdfTask({
        export_type: "pdf",
        config: chartConfig,
        filename_prefix: `billing-calculation-${selectedNMI}-${
          isRelativeTime ? relativeOption : `${selectedYear}-${selectedMonth}`
        }`,
      });

      const downloadUrl = await pollExportTask(data.task_id);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `billing-calculation-${selectedNMI}-${
        isRelativeTime ? relativeOption : `${selectedYear}-${selectedMonth}`
      }.pdf`;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      setTimeout(() => document.body.removeChild(link), 100);
    } catch (err: any) {
      console.error("PDF export failed:", err);
      toastManager.error(`Failed to export PDF: ${err.message || "Unknown error"}`);
    } finally {
      setIsExportingPDF(false);
    }
  }, [
    selectedNMI,
    selectedYear,
    selectedMonth,
    isRelativeTime,
    relativeOption,
    getCleanConfigParams,
  ]);

  const handleExportCSV = useCallback(async () => {
    if (!selectedNMI) return;
    try {
      setIsExportingCSV(true);
      const { data } = await exportApi.createCsvTask({
        type: "billing",
        nmi: selectedNMI,
        year: selectedYear,
        month: selectedMonth,
        state: selectedState,
      });

      const downloadUrl = await pollExportTask(data.task_id);
      window.location.href = downloadUrl;
    } catch (err) {
      console.error("CSV export failed:", err);
      toastManager.error("Failed to export CSV");
    } finally {
      setIsExportingCSV(false);
    }
  }, [selectedNMI, selectedYear, selectedMonth, selectedState]);

  const handleCopyConfig = useCallback(() => {
    copyChartConfig({
      chartType: "billing_calculation",
      chartName: "Billing Calculation",
      path: "/tables-charts/billing-calculation",
      params: getCleanConfigParams(),
    });
  }, [getCleanConfigParams]);

  return (
    <StandardChartContainer isLoading={isBillingLoading || isBreakdownLoading} chartType="billing_calculation">
      {/* 1. Header & Logo */}
      <PrintLogo />

      <StandardPageHeader
        title="Billing Calculation"
        onExportPDF={handleExportPDF}
        onExportCSV={handleExportCSV}
        onCopyConfig={handleCopyConfig}
        isExportingPDF={isExportingPDF}
        isExportingCSV={isExportingCSV}
      />

      {/* 2. Unified Parameter Panel */}
      <UnifiedParameterPanel>
        <NMISelector value={selectedNMI} onChange={setSelectedNMI} />
        <StateSelector value={selectedState} onChange={setSelectedState} />

        <div className="col-span-1 md:col-span-2 space-y-4">
          {/* Combined Time Controls */}
          <RelativeTimeSelector
            enabled={isRelativeTime}
            value={relativeOption}
            options={[
              { value: "last_full_month", label: "Last Full Month" },
              { value: "last_full_year", label: "Last Full Year" },
            ]}
            onToggle={setIsRelativeTime}
            onChange={setRelativeOption}
          />
            <TimeRangeSelector
              year={selectedYear}
              month={selectedMonth}
              onYearChange={(y) => setAbsoluteMonth(`${y}-${String(selectedMonth).padStart(2, '0')}`)}
              onMonthChange={(m) => setAbsoluteMonth(`${selectedYear}-${String(m).padStart(2, '0')}`)}
              availableYears={availableTimes?.years}
              availableMonths={availableMonths}
              disabled={isRelativeTime}
            />
        </div>
      </UnifiedParameterPanel>

      {/* 3. PDF Parameter Summary */}
      <PrintParameterSummary
        items={[
          { label: "NMI", value: selectedNMI },
          { label: "State", value: selectedState },
          { 
            label: "Report Month", 
            value: isRelativeTime ? `Relative (${relativeOption})` : absoluteMonth 
          },
          {
            label: "Date Range",
            value: rangeDisplay
              ? `${rangeDisplay.start} to ${rangeDisplay.end}`
              : "N/A",
          },
        ]}
      />

      {/* 4. NMI Information */}
      <NMIInfoCard
        nmi={selectedNMI}
        address={
          selectedNMIInfo
            ? [
                selectedNMIInfo.address,
                selectedNMIInfo.suburb,
                selectedNMIInfo.state,
                selectedNMIInfo.postcode,
              ]
                .filter(Boolean)
                .join(", ")
            : undefined
        }
      />

      {/* 5. Main Content Area */}
      {billingError ? (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg">
          <p className="font-semibold">Error loading billing data</p>
          <p className="text-sm mt-1">
            {(billingError as any)?.message || "Unknown error occurred"}
          </p>
        </div>
      ) : (
        <>
          {transformedSummary && (
            <>
              {lossFactorWarning && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-md shadow-sm">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-yellow-400"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">
                        <strong className="font-medium text-yellow-800">
                          Dynamic Pricing Configuration Warning:
                        </strong>{" "}
                        Loss Factors (DLF/TLF) not configured for {" "}
                        <strong>{`${lossFactorWarning.missing_financial_year}-07-01`}</strong> to <strong>{`${(lossFactorWarning.missing_financial_year || 0) + 1}-06-30`}</strong>. 
                        Calculated using default 0.
                      </p>
                      {lossFactorWarning.scheme_id && (
                        <p className="mt-2 text-sm text-yellow-700">
                          <Link
                            to={`/data-configuration/pricing-scheme/${lossFactorWarning.scheme_id}/edit`}
                            className="font-medium underline hover:text-yellow-600"
                          >
                            Click here to configure Annual Loss Factors (DLF & TLF)
                          </Link>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <BillingChartSection
                chartData={chartData}
                barKeys={barKeys}
                rangeDisplay={rangeDisplay}
                isLoading={isBillingLoading}
                isPrintMode={isPrintMode}
                isChartMode={isChartMode}
              />

              <ScreenshotDivider id="section-1-end" isVisible={isChartMode} />

              <BillingSummaryTable
                summary={transformedSummary}
                rangeDisplay={rangeDisplay}
                state={selectedState}
              />

              <ScreenshotDivider id="section-2-end" isVisible={isChartMode} />

              {!isPrintMode && (
                <div>
                  <BillingBreakdownTable
                    data={chartData}
                    periodNames={pricingPeriodNames}
                    demandNames={demandNames}
                    pricingPeriodKeyMap={pricingPeriodKeyMap}
                    demandKeyMap={demandKeyMap}
                  />
                </div>
              )}
            </>
          )}

          {!selectedNMI && sortedNMIs.length === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg">
              No monitored NMIs available. Please check your configuration.
            </div>
          )}
        </>
      )}
    </StandardChartContainer>
  );
}
