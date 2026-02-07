// Channel Selector Component - Selects a channel from available channels with data
import React from "react";
import type { Reading } from "./DataTable";

// Check if column is a power metric
const isPowerMetric = (columnName: string): boolean => {
  // Check if it matches the pattern: {metric}_{direction}
  const powerMetricPattern = /^(kw|kvar|kva|pf)_(import|export)$/i;
  return powerMetricPattern.test(columnName);
};

interface ChannelSelectorProps {
  readings: Reading[];
  value: string;
  onChange: (channel: string) => void;
  isLoading?: boolean;
}

export const ChannelSelector: React.FC<ChannelSelectorProps> = ({
  readings,
  value,
  onChange,
  isLoading = false,
}) => {
  // Get all available channels (excluding timestamp fields and total fields)
  const availableChannels = React.useMemo(() => {
    if (!readings || readings.length === 0) return [];

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

    readings.forEach((reading) => {
      Object.keys(reading).forEach((key) => {
        if (
          key !== "timestamp" &&
          key !== "timestamp_utc" &&
          key !== "timestamp_local_iso" &&
          key !== "timezone" &&
          !intermediateColumns.has(key) &&
          reading[key] !== null &&
          reading[key] !== undefined
        ) {
          // Check if the value is numeric (including 0)
          const val = reading[key];
          let numValue: number;
          if (typeof val === "number") {
            numValue = val;
          } else {
            numValue = parseFloat(String(val));
          }
          // Allow 0 values and valid numbers (not NaN)
          if (!isNaN(numValue)) {
            if (isPowerMetric(key)) {
              powerMetrics.add(key);
            } else {
              rawChannels.add(key);
            }
          }
        }
      });
    });

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

    // Sort and combine: rawChannels first, then powerMetrics
    const sortedRawChannels = sortRawChannels(Array.from(rawChannels));
    const sortedPowerMetrics = sortPowerMetrics(Array.from(powerMetrics));

    return [...sortedRawChannels, ...sortedPowerMetrics];
  }, [readings]);

  // Auto-select first channel if none selected and channels available
  // Also update if current channel is no longer available
  React.useEffect(() => {
    if (availableChannels.length === 0) {
      if (value) {
        onChange("");
      }
      return;
    }

    if (!value) {
      // No channel selected, select first available
      onChange(availableChannels[0]);
    } else if (!availableChannels.includes(value)) {
      // Current channel no longer available, select first available
      onChange(availableChannels[0]);
    }
  }, [value, availableChannels, onChange]);

  if (isLoading) {
    return (
      <div className="mb-4">
        <div className="text-sm text-gray-500">Loading channels...</div>
      </div>
    );
  }

  if (availableChannels.length === 0) {
    return (
      <div className="mb-4">
        <div className="text-sm text-gray-500">
          No channels with data available
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        {availableChannels.map((channel) => (
          <option key={channel} value={channel}>
            {channel}
          </option>
        ))}
      </select>
    </div>
  );
};
