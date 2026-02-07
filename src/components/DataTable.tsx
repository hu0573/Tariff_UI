// Data Table Component
import React from "react";
import { Tooltip } from "./common/Tooltip";

export interface Reading {
  local_time: string;
  timestamp_utc: number;
  [key: string]: string | number | null | undefined;
}

// Channel symbols reference data
const CHANNEL_SYMBOLS: Record<
  string,
  { series: string; unit: string; description: string }
> = {
  E: {
    series: "E Series",
    unit: "KWH",
    description:
      "E1 General Supply Energy (Consumption), E2 Controlled Load Energy (Consumption) - varies by installation",
  },
  Q: {
    series: "Q Series",
    unit: "KVARH",
    description: "Reactive Energy (Consumption)",
  },
  B: {
    series: "B Series",
    unit: "KWH",
    description: "Export Energy (Generation)",
  },
  K: {
    series: "K Series",
    unit: "KVARH",
    description: "Reactive Energy (Generation)",
  },
};

// Power metrics configuration
const POWER_METRICS: Record<
  string,
  {
    name: string;
    unit: string;
    description: string;
    category: "power" | "power_factor";
    decimals: number;
  }
> = {
  kw_import: {
    name: "kW Import",
    unit: "kW",
    description: "KW IMPORT",
    category: "power",
    decimals: 2,
  },
  kw_export: {
    name: "kW Export",
    unit: "kW",
    description: "EXPORT (KW)",
    category: "power",
    decimals: 2,
  },
  kvar_import: {
    name: "kVAr Import",
    unit: "kVAr",
    description: "IMPORT (KVAR)",
    category: "power",
    decimals: 2,
  },
  kvar_export: {
    name: "kVAr Export",
    unit: "kVAr",
    description: "EXPORT (KVAR)",
    category: "power",
    decimals: 2,
  },
  kva_import: {
    name: "kVA Import",
    unit: "kVA",
    description: "KVA (IMPORT)",
    category: "power",
    decimals: 2,
  },
  pf_import: {
    name: "PF Import",
    unit: "",
    description: "PF (IMPORT)",
    category: "power_factor",
    decimals: 3,
  },
};

// Convert field name to display name (e.g., "kva_import" -> "kVA Import")
const formatPowerMetricName = (fieldName: string): string => {
  // Map of metric prefixes to display names
  const metricMap: Record<string, string> = {
    kw: "kW",
    kvar: "kVAr",
    kva: "kVA",
    pf: "PF",
  };

  // Split field name by underscore
  const parts = fieldName.split("_");
  if (parts.length < 2) {
    console.warn(
      `[DataTable] formatPowerMetricName: Invalid field name format: "${fieldName}"`
    );
    return fieldName;
  }

  const metricPrefix = parts[0].toLowerCase();
  const direction = parts[1].toLowerCase();

  // Get metric display name
  const metricName = metricMap[metricPrefix] || metricPrefix.toUpperCase();

  // Capitalize direction
  const directionName = direction.charAt(0).toUpperCase() + direction.slice(1);

  return `${metricName} ${directionName}`;
};

// Get unit from field name
const getPowerMetricUnit = (fieldName: string): string => {
  const metricPrefix = fieldName.split("_")[0].toLowerCase();
  const unitMap: Record<string, string> = {
    kw: "kW",
    kvar: "kVAr",
    kva: "kVA",
    pf: "", // PF has no unit
  };
  return unitMap[metricPrefix] || "";
};

// Check if column is a power metric
const isPowerMetric = (columnName: string): boolean => {
  // Check if it's in the POWER_METRICS config or matches the pattern
  if (columnName in POWER_METRICS) return true;

  // Also check if it matches the pattern: {metric}_{direction}
  const powerMetricPattern = /^(kw|kvar|kva|pf)_(import|export)$/i;
  return powerMetricPattern.test(columnName);
};

// Get power metric info
const getPowerMetricInfo = (columnName: string) => {
  // Always generate from field name to ensure consistency with CSV field names
  return {
    name: formatPowerMetricName(columnName),
    unit: getPowerMetricUnit(columnName),
    description: columnName.toUpperCase().replace(/_/g, " "),
    category: columnName.startsWith("pf") ? "power_factor" : "power",
    decimals: columnName.startsWith("pf") ? 3 : 2,
  };
};

// Get channel description from column name
const getChannelDescription = (columnName: string): string | null => {
  if (!columnName) return null;

  // Extract the first letter (E, Q, B, K) from column name
  const firstChar = columnName.charAt(0).toUpperCase();
  const channelInfo = CHANNEL_SYMBOLS[firstChar];

  if (!channelInfo) return null;

  // Extract type (e.g., E1, E2, etc.)
  const match = columnName.match(/^([A-Z])(\d+)/i);
  const type = match ? `${firstChar}${match[2]}` : columnName;

  return `${channelInfo.series} - ${type}\n${channelInfo.unit}: ${channelInfo.description}`;
};


interface PowerMetric {
  id: number;
  code: string;
  name: string;
  description?: string;
}


interface DataTableProps {
  readings: Reading[];
  isLoading?: boolean;
  includedChannels?: Set<string>;
  channelStatusMap?: Map<string, "active" | "unused" | "unregistered">;
  channelMappingMap?: Map<
    string,
    {
      description?: string;
      power_metrics_id?: number | null;
    }
  >;
  powerMetricsOptions?: PowerMetric[];
}

export const DataTable: React.FC<DataTableProps> = ({
  readings,
  isLoading = false,
  includedChannels = new Set(),
  channelStatusMap = new Map(),
  channelMappingMap = new Map(),
  powerMetricsOptions = [],
}) => {
  if (isLoading) {
    return <div className="text-center py-8 text-gray-500">Loading...</div>;
  }

  if (readings.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No data available for this time period
      </div>
    );
  }

  // Get all columns with values (excluding timestamp and timestamp_utc), grouped by type
  const getGroupedColumns = () => {
    if (readings.length === 0) return { rawChannels: [], powerMetrics: [] };

    // Intermediate calculation columns to hide (E_total, Q_total, B_total, K_total)
    const intermediateColumns = new Set([
      "E_total",
      "Q_total",
      "B_total",
      "K_total",
      "e_total",
      "q_total",
      "b_total",
      "k_total",
    ]);

    const rawChannels = new Set<string>();
    const powerMetrics = new Set<string>();

    // First pass: collect all possible columns from all readings
    const allPossibleColumns = new Set<string>();
    readings.forEach((reading) => {
      Object.keys(reading).forEach((key) => {
        if (
          key !== "local_time" &&
          key !== "timestamp_utc" &&
          !intermediateColumns.has(key)
        ) {
          allPossibleColumns.add(key);
        }
      });
    });

    // Second pass: categorize columns
    // For both power metrics and raw channels, only include if they have at least one non-null value
    allPossibleColumns.forEach((key) => {
      const hasValue = readings.some(
        (reading) => reading[key] !== null && reading[key] !== undefined
      );
      if (hasValue) {
        if (isPowerMetric(key)) {
          powerMetrics.add(key);
        } else {
          rawChannels.add(key);
        }
      }
    });

    // Debug logging - only log if there are unexpected missing metrics
    const expectedMetrics = [
      "kw_import",
      "kw_export",
      "kvar_import",
      "kvar_export",
      "kva_import",
      "pf_import",
    ];
    const missingMetrics = expectedMetrics.filter((m) => !powerMetrics.has(m));
    if (missingMetrics.length > 0) {
      console.log(`[DataTable] Missing power metrics in data:`, missingMetrics);
      console.log(
        `[DataTable] Available keys:`,
        readings.length > 0 ? Object.keys(readings[0]) : []
      );
    }

    // Custom sort for raw channels: E1K1E2K2...E6K6B1Q1...B6Q6
    const sortRawChannels = (channels: string[]): string[] => {
      // Extract channel type and number
      const parseChannel = (ch: string) => {
        const match = ch.match(/^([EK])(\d+)$/i) || ch.match(/^([BQ])(\d+)$/i);
        if (match) {
          return {
            type: match[1].toUpperCase(),
            number: parseInt(match[2], 10),
            original: ch,
          };
        }
        return { type: ch[0]?.toUpperCase() || "", number: 0, original: ch };
      };

      const parsed = channels.map(parseChannel);

      // Separate E/K channels and B/Q channels
      const ekChannels = parsed.filter((p) => p.type === "E" || p.type === "K");
      const bqChannels = parsed.filter((p) => p.type === "B" || p.type === "Q");
      const otherChannels = parsed.filter(
        (p) => !["E", "K", "B", "Q"].includes(p.type)
      );

      // Sort E/K channels: pair E and K by number (E1, K1, E2, K2, ...)
      const ekSorted: string[] = [];
      const ekNumbers = new Set(ekChannels.map((c) => c.number));
      Array.from(ekNumbers)
        .sort((a, b) => a - b)
        .forEach((num) => {
          const eChannel = ekChannels.find(
            (c) => c.type === "E" && c.number === num
          );
          const kChannel = ekChannels.find(
            (c) => c.type === "K" && c.number === num
          );
          if (eChannel) ekSorted.push(eChannel.original);
          if (kChannel) ekSorted.push(kChannel.original);
        });

      // Sort B/Q channels: pair B and Q by number (B1, Q1, B2, Q2, ...)
      const bqSorted: string[] = [];
      const bqNumbers = new Set(bqChannels.map((c) => c.number));
      Array.from(bqNumbers)
        .sort((a, b) => a - b)
        .forEach((num) => {
          const bChannel = bqChannels.find(
            (c) => c.type === "B" && c.number === num
          );
          const qChannel = bqChannels.find(
            (c) => c.type === "Q" && c.number === num
          );
          if (bChannel) bqSorted.push(bChannel.original);
          if (qChannel) bqSorted.push(qChannel.original);
        });

      // Sort other channels alphabetically
      const otherSorted = otherChannels.map((c) => c.original).sort();

      return [...ekSorted, ...bqSorted, ...otherSorted];
    };

    // Custom sort for power metrics: kW Import, kW Export, kVAr Import, kVAr Export, kVA, PF
    const sortPowerMetrics = (metrics: string[]): string[] => {
      const order = [
        "kw_import",
        "kw_export",
        "kvar_import",
        "kvar_export",
        "kva_import",
        "pf_import",
      ];

      const ordered: string[] = [];
      const unordered: string[] = [];

      // Add metrics in specified order
      order.forEach((metric) => {
        if (metrics.includes(metric)) {
          ordered.push(metric);
        }
      });

      // Add any other metrics not in the order list
      metrics.forEach((metric) => {
        if (!order.includes(metric)) {
          unordered.push(metric);
        }
      });

      return [...ordered, ...unordered.sort()];
    };

    return {
      rawChannels: sortRawChannels(Array.from(rawChannels)),
      powerMetrics: sortPowerMetrics(Array.from(powerMetrics)),
    };
  };

  const { rawChannels, powerMetrics } = getGroupedColumns();
  const allColumns = [...rawChannels, ...powerMetrics];

  const formatValue = (
    value: string | number | null | undefined,
    columnName?: string
  ): string => {
    if (value === null || value === undefined) return "";
    if (typeof value === "number") {
      // Use specific decimal places for power metrics
      if (columnName && isPowerMetric(columnName)) {
        const metricInfo = getPowerMetricInfo(columnName);
        return value.toFixed(metricInfo.decimals);
      }
      // Default formatting for raw channels
      return value.toFixed(5);
    }
    return String(value);
  };

  const formatTimestamp = (reading: Reading): string => {
    // Format ISO timestamp for display: "2025-11-01 00:00:00"
    if (!reading.local_time) return "";
    
    // Split "2025-11-01T00:00:00+10:30" to get date and time
    const parts = reading.local_time.split('T');
    if (parts.length < 2) return reading.local_time;
    
    const date = parts[0];
    const time = parts[1].split('+')[0].split('-')[0]; // Remove offset
    
    return `${date} ${time}`;
  };

  // Get status display info
  const getStatusDisplay = (status?: string) => {
    switch (status) {
      case "active":
        return {
          icon: "✓",
          text: "Active",
          className: "text-green-600",
        };
      case "unused":
        return {
          icon: "○",
          text: "Unused",
          className: "text-yellow-600",
        };
      case "unregistered":
        return {
          icon: "-",
          text: "Unreg.",
          className: "text-gray-500",
        };
      default:
        return null;
    }
  };

  // Group headers for better organization
  const renderColumnHeader = (col: string, isPowerMetricCol: boolean) => {
    let headerContent: React.ReactNode;
    let headerClass =
      "px-4 py-3 text-left text-xs font-medium uppercase tracking-wider border-b";

    if (isPowerMetricCol) {
      const metricInfo = getPowerMetricInfo(col);

      headerContent = (
        <Tooltip content={metricInfo.description} position="bottom">
          <span className="cursor-help text-blue-600">
            {metricInfo.name}
            {metricInfo.unit && (
              <>
                {" "}
                <span className="text-xs">({metricInfo.unit})</span>
              </>
            )}
          </span>
        </Tooltip>
      );
      headerClass += " text-blue-600 bg-blue-50";
    } else {
      const channelDescription = getChannelDescription(col);
      const isIncluded = includedChannels.has(col);
      const channelStatus = channelStatusMap.get(col);
      const statusDisplay = getStatusDisplay(channelStatus);

      // Build channel name with status indicator
      const channelName = (
        <span
          className={`flex items-center gap-1 ${
            isIncluded ? "text-red-600 font-semibold" : ""
          }`}
        >
          <span>{col}</span>
          {statusDisplay && (
            <span
              className={`text-xs font-normal ${statusDisplay.className}`}
              title={statusDisplay.text}
            >
              {statusDisplay.icon}
            </span>
          )}
        </span>
      );

      // Get channel mapping info
      const channelMapping = channelMappingMap.get(col);
      const powerMetric = channelMapping?.power_metrics_id
        ? powerMetricsOptions.find(
            (pm) => pm.id === channelMapping.power_metrics_id
          )
        : null;

      // Build tooltip content with all info
      let tooltipContent = channelDescription || col;

      // Add Description (only if channel mapping exists and has description)
      if (channelMapping) {
        if (channelMapping.description) {
          tooltipContent += `\n\nDescription: ${channelMapping.description}`;
        } else {
          tooltipContent += `\n\nDescription: -- None --`;
        }
      }

      // Add Power Metrics (only if channel mapping exists)
      if (channelMapping) {
        if (powerMetric) {
          tooltipContent += `\n\nMetric Inclusion: ${powerMetric.name}`;
        } else {
          tooltipContent += `\n\nMetric Inclusion: -- None --`;
        }
      }


      // Add Status
      if (statusDisplay) {
        tooltipContent += `\n\nStatus: ${statusDisplay.text}`;
        if (statusDisplay.text === "Active") {
          tooltipContent +=
            "\nHas data in the past 30 days with non-zero records. Will participate in calculation after configuration via Metric Inclusion.";
        } else if (statusDisplay.text === "Unused") {
          tooltipContent +=
            "\nAll data in the past 30 days are 0 (not null, but value is 0). Can be configured, but has no effect on calculation results (all zeros).";
        } else if (statusDisplay.text === "Unreg.") {
          tooltipContent +=
            "\nAll data in the past 30 days are null (all channel data in database are null). Can be configured, but has no effect on calculation results (all null).";
        }
      }

      headerContent = channelDescription ? (
        <Tooltip content={tooltipContent} position="bottom">
          <span className="cursor-help">{channelName}</span>
        </Tooltip>
      ) : statusDisplay ? (
        <Tooltip content={tooltipContent} position="bottom">
          <span className="cursor-help">{channelName}</span>
        </Tooltip>
      ) : (
        channelName
      );
      headerClass += isIncluded
        ? " text-red-600 bg-red-50"
        : " text-gray-500 bg-gray-50";
    }

    return (
      <th key={col} className={headerClass}>
        {headerContent}
      </th>
    );
  };

  return (
    <div className="overflow-x-auto max-w-full w-full">
      <table
        className="bg-white border border-gray-200 rounded-lg table-auto"
        style={{ minWidth: "1200px" }}
      >
        <thead>
          {/* Group headers */}
          {(rawChannels.length > 0 || powerMetrics.length > 0) && (
            <tr className="bg-gray-100">
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 border-b">
                Timestamp
              </th>
              {rawChannels.length > 0 && (
                <th
                  colSpan={rawChannels.length}
                  className="px-4 py-2 text-center text-xs font-semibold text-gray-700 border-b border-l-2 border-gray-300"
                >
                  Raw Channels
                </th>
              )}
              {powerMetrics.length > 0 && (
                <th
                  colSpan={powerMetrics.length}
                  className="px-4 py-2 text-center text-xs font-semibold text-blue-700 border-b border-l-2 border-blue-300 bg-blue-50"
                >
                  Power Metrics
                </th>
              )}
            </tr>
          )}
          {/* Column headers */}
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider border-b text-gray-500">
              Timestamp
            </th>
            {rawChannels.map((col) => renderColumnHeader(col, false))}
            {powerMetrics.map((col) => renderColumnHeader(col, true))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {readings.map((reading, index) => (
            <tr
              key={`${reading.timestamp_utc}-${index}`}
              className="hover:bg-gray-50"
            >
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                {formatTimestamp(reading)}
              </td>
              {allColumns.map((col) => {
                const isIncluded =
                  !isPowerMetric(col) && includedChannels.has(col);
                return (
                  <td
                    key={col}
                    className={`px-4 py-3 whitespace-nowrap text-sm ${
                      isPowerMetric(col)
                        ? "text-blue-600 font-medium"
                        : isIncluded
                        ? "text-red-600 font-medium"
                        : "text-gray-600"
                    }`}
                  >
                    {formatValue(reading[col], col)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
