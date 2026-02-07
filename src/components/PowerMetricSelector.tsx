// Power Metric Selector Component - Selects power metrics for chart display
import React from "react";
import type { Reading } from "./DataTable";

interface PowerMetric {
  id: string;
  name: string;
  description: string;
  unit: string;
  category: "power" | "power_factor";
  isPowerMetric: boolean;
}

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
  if (parts.length < 2) return fieldName;

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

// Get description from field name
const getPowerMetricDescription = (fieldName: string): string => {
  return fieldName.toUpperCase().replace(/_/g, " ");
};

// Check if field name is a power metric
const isPowerMetricField = (fieldName: string): boolean => {
  const powerMetricPattern = /^(kw|kvar|kva|pf)_(import|export)$/i;
  return powerMetricPattern.test(fieldName);
};

// Create PowerMetric from field name
const createPowerMetric = (fieldName: string): PowerMetric => {
  return {
    id: fieldName,
    name: formatPowerMetricName(fieldName),
    description: getPowerMetricDescription(fieldName),
    unit: getPowerMetricUnit(fieldName),
    category: fieldName.startsWith("pf") ? "power_factor" : "power",
    isPowerMetric: true,
  };
};

interface PowerMetricSelectorProps {
  readings: Reading[];
  value: string;
  onChange: (metric: string) => void;
  isLoading?: boolean;
}

export const PowerMetricSelector: React.FC<PowerMetricSelectorProps> = ({
  readings,
  value,
  onChange,
  isLoading = false,
}) => {
  // 自动检测可用的功率指标（后端已计算）
  const availableMetrics = React.useMemo(() => {
    if (!readings || readings.length === 0) return [];

    // Find all power metric fields in the readings
    const powerMetricFields = new Set<string>();
    readings.forEach((reading) => {
      Object.keys(reading).forEach((key) => {
        if (
          key !== "timestamp" &&
          key !== "timestamp_utc" &&
          key !== "timestamp_local_iso" &&
          key !== "timezone" &&
          isPowerMetricField(key) &&
          reading[key] !== null &&
          reading[key] !== undefined
        ) {
          powerMetricFields.add(key);
        }
      });
    });

    // Convert field names to PowerMetric objects
    return Array.from(powerMetricFields)
      .map(createPowerMetric)
      .sort((a, b) => {
        // Sort by: import first, then export; then by metric type
        const aIsImport = a.id.includes("import");
        const bIsImport = b.id.includes("import");
        if (aIsImport !== bIsImport) {
          return aIsImport ? -1 : 1;
        }
        return a.id.localeCompare(b.id);
      });
  }, [readings]);

  // 自动选择第一个可用的指标
  React.useEffect(() => {
    if (availableMetrics.length > 0 && !value) {
      // 优先选择kW Import，如果没有则选择第一个可用的
      const preferredMetric =
        availableMetrics.find((m) => m.id === "kw_import") ||
        availableMetrics[0];
      onChange(preferredMetric.id);
    }
  }, [availableMetrics, value, onChange]);

  if (isLoading) {
    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Power Metric
        </label>
        <div className="text-sm text-gray-500">Loading power metrics...</div>
      </div>
    );
  }

  if (availableMetrics.length === 0) {
    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Power Metric
        </label>
        <div className="text-sm text-gray-500">No power metrics available</div>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Power Metric
      </label>
      <div className="flex flex-wrap gap-2">
        {availableMetrics.map((metric) => (
          <button
            key={metric.id}
            type="button"
            onClick={() => onChange(metric.id)}
            className={`px-3 py-2 rounded-lg transition-colors text-sm ${
              value === metric.id
                ? "bg-blue-600 text-white font-medium"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            title={metric.description}
          >
            {metric.name}
            {metric.unit && (
              <span className="ml-1 text-xs opacity-75">({metric.unit})</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
