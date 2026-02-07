import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import type { BillingChartSectionProps } from '../BillingCalculation.types';

export const BillingChartSection: React.FC<BillingChartSectionProps & { isChartMode?: boolean }> = ({
  chartData,
  barKeys,
  rangeDisplay,
  isLoading,
  isPrintMode,
  isChartMode,
}) => {
  const isAnimationActive = !isPrintMode && !isChartMode;
  if (isLoading) {
    // You might render a local Skeleton loader here or let the parent handle it
    // For now assuming parent handles main loading state, but if partial updates:
    return <div className="h-[400px] w-full bg-gray-50 animate-pulse rounded-lg" />;
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center text-gray-500">
        No chart data available.
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 print:shadow-none print:border print:p-2">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Cost Breakdown</h3>
        {rangeDisplay && (
          <p className="text-sm text-gray-500">
            {rangeDisplay.start} to {rangeDisplay.end}
          </p>
        )}
      </div>

      <div className="h-[400px] w-full print:h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            className="print:text-xs"
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis 
                dataKey="label" 
                tick={{ fontSize: '0.75rem' }}
                interval="preserveStartEnd"
            />
            <YAxis 
                tickFormatter={(value) => `$${value}`}
                tick={{ fontSize: '0.75rem' }} 
                width={80} // Give enough room for currency
            />
            <Tooltip
              formatter={(value: any, name: any) => [`$${Number(value).toFixed(2)}`, name]}
              labelStyle={{ color: '#111827', fontWeight: 600 }}
              contentStyle={{ borderRadius: '0.375rem', border: '1px solid #e5e7eb', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            {barKeys.map((item) => (
              <Bar
                key={item.key}
                dataKey={item.key}
                name={item.label}
                stackId="a"
                fill={item.color}
                maxBarSize={50} // Prevent overly wide bars
                isAnimationActive={isAnimationActive}
                animationDuration={isAnimationActive ? 1500 : 0}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
