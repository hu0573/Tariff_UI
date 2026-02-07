// Power Metrics Chart Component - Based on HourlyChart with dual Y-axis support for power factor
import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { Reading } from "./DataTable";

interface PowerMetricsChartProps {
  readings: Reading[];
  selectedMetric: string;
  isLoading?: boolean;
}

export const PowerMetricsChart: React.FC<PowerMetricsChartProps> = ({
  readings,
  selectedMetric,
  isLoading = false,
}) => {
  // Process data: use raw data points without aggregation, sorted by time
  const chartData = useMemo(() => {
    if (!readings || readings.length === 0 || !selectedMetric) {
      return [];
    }

    return readings
      .map((reading) => {
        const value = reading[selectedMetric];
        if (value === null || value === undefined) return null;

        const numericValue =
          typeof value === "number" ? value : parseFloat(String(value));

        if (isNaN(numericValue)) return null;

        const dateStr = reading.local_time || "";
        let timePart = dateStr;
        // Handle "YYYY-MM-DDTHH:MM:SS"
        if (dateStr.includes("T")) {
          timePart = dateStr.split("T")[1].split('+')[0].split('-')[0];
        }
        const timeLabel = timePart ? timePart.substring(0, 5) : "";

        return {
          timestamp: reading.local_time,
          timeLabel: timeLabel,
          value: numericValue,
          fullTimestamp: reading.local_time,
        };
      })
      .filter((point) => point !== null) as Array<{
      timestamp: string;
      timeLabel: string;
      value: number;
      fullTimestamp: string;
    }>;
  }, [readings, selectedMetric]);

  // Determine if this metric needs dual Y-axis (power factor)
  const isPowerFactor = selectedMetric === "pf_import";

  // Get appropriate colors and styles for power metrics
  const getChartConfig = () => {
    if (isPowerFactor) {
      return {
        barColor: "#10b981", // Green for power factor
        yAxisLabel: "Power Factor",
        domain: [0, 1] as [number, number],
      };
    }

    // Default power metrics styling
    const powerColors: Record<string, string> = {
      kw_import: "#3b82f6", // Blue for kW import
      kw_export: "#f59e0b", // Amber for kW export
      kvar_import: "#8b5cf6", // Purple for kVAr import
      kvar_export: "#ef4444", // Red for kVAr export
      kva_import: "#06b6d4", // Cyan for kVA import
    };

    return {
      barColor: powerColors[selectedMetric] || "#6b7280",
      yAxisLabel: selectedMetric.toUpperCase(),
      domain: ["auto", "auto"] as ["auto" | number, "auto" | number],
    };
  };

  const chartConfig = getChartConfig();

  if (isLoading) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Loading chart data...</p>
      </div>
    );
  }

  if (!selectedMetric) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Please select a power metric to display</p>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No data available for metric {selectedMetric}</p>
        <p className="text-xs mt-2">Readings count: {readings?.length || 0}</p>
      </div>
    );
  }

  // Calculate angle and interval for X-axis labels based on data point count
  const shouldRotateLabels = chartData.length > 20;
  // Unused angle/interval logic removed


  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={chartData}
          margin={{
            top: 20,
            right: isPowerFactor ? 60 : 30, // Extra space for right Y-axis
            left: 20,
            bottom: shouldRotateLabels ? 80 : 40,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="timeLabel"
            angle={0}
            textAnchor="middle"
            height={40}
            interval={0}
            ticks={chartData.map(d => d.timeLabel).filter(t => t.endsWith(":00"))}
            tick={{ fontSize: '0.625rem' }}
            label={{ value: "Time", position: "insideBottom", offset: -5 }}
          />
          {/* Left Y-axis for all metrics */}
          <YAxis
            yAxisId="left"
            orientation="left"
            label={{
              value: isPowerFactor ? "Other Metrics" : chartConfig.yAxisLabel,
              angle: -90,
              position: "insideLeft",
            }}
            domain={isPowerFactor ? ["auto", "auto"] : chartConfig.domain}
          />
          {/* Right Y-axis for power factor */}
          {isPowerFactor && (
            <YAxis
              yAxisId="right"
              orientation="right"
              label={{
                value: chartConfig.yAxisLabel,
                angle: 90,
                position: "insideRight",
              }}
              domain={chartConfig.domain}
            />
          )}
          <Tooltip
            formatter={(value: any) => [
              isPowerFactor ? Number(value).toFixed(3) : Number(value).toFixed(2),
              chartConfig.yAxisLabel,
            ]}
            labelFormatter={(label, payload) => {
              if (payload && payload[0] && payload[0].payload) {
                return `Time: ${payload[0].payload.fullTimestamp}`;
              }
              return `Time: ${label}`;
            }}
          />
          <Legend />
          <Bar
            yAxisId={isPowerFactor ? "right" : "left"}
            dataKey="value"
            fill={chartConfig.barColor}
            name={chartConfig.yAxisLabel}
            radius={[2, 2, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
