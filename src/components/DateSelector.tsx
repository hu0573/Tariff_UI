// Date Selector Component (supports day/week/month modes)
import React from 'react';
import type { PageMode } from './PageModeSelector';

interface DateSelectorProps {
  pageMode: PageMode;
  value?: string; // For day: YYYY-MM-DD, for week: YYYY-Www, for month: YYYY-MM
  onChange: (value: string) => void;
  availableDates?: string[];
  isLoading?: boolean;
  disabled?: boolean;
  weekStart?: string; // For week mode: start date
  weekEnd?: string; // For week mode: end date
}

export const DateSelector: React.FC<DateSelectorProps> = ({
  pageMode,
  value,
  onChange,
  availableDates,
  isLoading = false,
  disabled = false,
  weekStart,
  weekEnd,
}) => {
  // Day mode: date input
  if (pageMode === 'day') {
    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Date
        </label>
        <input
          type="date"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={isLoading || disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
        {availableDates && availableDates.length > 0 && (
          <p className="mt-1 text-xs text-gray-500">
            Available Date Range: {availableDates[0]} to {availableDates[availableDates.length - 1]}
          </p>
        )}
      </div>
    );
  }

  // Week mode: week input with date range display
  if (pageMode === 'week') {
    const weekDisplay = value
      ? `${value}${weekStart && weekEnd ? ` (${weekStart} - ${weekEnd})` : ''}`
      : '';
    
    // Convert ISO week format (YYYY-Www) to HTML5 week format (YYYY-Www)
    const html5WeekValue = value ? value : '';
    
    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Week
        </label>
        <input
          type="week"
          value={html5WeekValue}
          onChange={(e) => {
            // HTML5 week format is already YYYY-Www, so we can use it directly
            onChange(e.target.value);
          }}
          disabled={isLoading || disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
        {weekDisplay && (
          <p className="mt-1 text-xs text-gray-500">
            Current Week: {weekDisplay}
          </p>
        )}
      </div>
    );
  }

  // Month mode: month input
  if (pageMode === 'month') {
    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Month
        </label>
        <input
          type="month"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={isLoading || disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
      </div>
    );
  }

  return null;
};
