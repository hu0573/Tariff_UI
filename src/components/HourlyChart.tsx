// Hourly Chart Component - Shows raw data points for a selected channel (no aggregation)
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

interface HourlyChartProps {
  readings: Reading[];
  selectedChannel: string;
  isLoading?: boolean;
}

export const HourlyChart: React.FC<HourlyChartProps> = ({
  readings,
  selectedChannel,
  isLoading = false,
}) => {
  // Process data: use raw data points without aggregation, sorted by time
  const chartData = useMemo(() => {
    if (!readings || readings.length === 0 || !selectedChannel) {
      return [];
    }

    return readings
      .map((reading) => {
        const value = reading[selectedChannel];
        if (value === null || value === undefined) return null;

        const numericValue =
          typeof value === "number" ? value : parseFloat(String(value));

        if (isNaN(numericValue)) return null;

        const dateStr = reading.local_time || "";
        let timePart = dateStr;
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
  }, [readings, selectedChannel]);

  if (isLoading) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Loading chart data...</p>
      </div>
    );
  }

  if (!selectedChannel) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Please select a channel to display</p>
      </div>
    );
  }

  if (chartData.length === 0) {
    // Check if channel has any non-null values
    const hasData = readings?.some(
      (r) =>
        r[selectedChannel] !== null &&
        r[selectedChannel] !== undefined &&
        !isNaN(Number(r[selectedChannel]))
    );

    return (
      <div className="text-center py-8 text-gray-500">
        <p>No data available for channel {selectedChannel}</p>
        {!hasData && readings && readings.length > 0 && (
          <p className="text-xs mt-2 text-gray-400">
            Channel {selectedChannel} has no valid data points (all values are
            null or zero)
          </p>
        )}
        {readings && readings.length === 0 && (
          <p className="text-xs mt-2">No readings available</p>
        )}
      </div>
    );
  }

  // Calculate angle and interval for X-axis labels based on data point count
  // If too many points, rotate labels and show fewer labels to avoid overlap
  const shouldRotateLabels = chartData.length > 20;
  const angle = shouldRotateLabels ? -45 : 0;
  // Calculate interval: show every Nth label based on data count
  // For 50+ points, show every 5th; for 20-50, show every 3rd; otherwise show all
  const calculateInterval = () => {
    const count = chartData.length;
    if (count >= 50) return 4; // Show every 5th label (0, 5, 10, ...)
    if (count >= 30) return 2; // Show every 3rd label (0, 3, 6, ...)
    if (count >= 20) return 1; // Show every 2nd label (0, 2, 4, ...)
    return 0; // Show all labels
  };
  const interval = calculateInterval();

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
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
            reversed={false}
            allowDataOverflow={false}
          />
          <YAxis
            label={{
              value: selectedChannel,
              angle: -90,
              position: "insideLeft",
            }}
          />
          <Tooltip
            formatter={(value: number) => [value.toFixed(5), selectedChannel]}
            labelFormatter={(label, payload) => {
              if (payload && payload[0] && payload[0].payload) {
                return `Time: ${payload[0].payload.fullTimestamp}`;
              }
              return `Time: ${label}`;
            }}
          />
          <Legend />
          <Bar
            dataKey="value"
            fill="#3b82f6"
            name={selectedChannel}
            radius={[2, 2, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
