import React from 'react';
import { format } from "date-fns";

export interface TimeRangeSelectorProps {
  year: number;
  month: number;
  availableYears?: number[];
  availableMonths?: number[]; // Available months for the SELECTED year
  onYearChange: (year: number) => void;
  onMonthChange: (month: number) => void;
  disabled?: boolean;
}

export const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({
  year,
  month,
  availableYears = [],
  availableMonths = [],
  onYearChange,
  onMonthChange,
  disabled = false,
}) => {
    // Default to current year if availableYears is empty
    const currentYear = new Date().getFullYear();
    const years = availableYears.length > 0 ? availableYears : [currentYear];
    
    // Default to 1-12 if availableMonths is empty
    const months = availableMonths.length > 0 ? availableMonths : Array.from({length: 12}, (_, i) => i + 1);

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Year</label>
        <select
          value={year}
          onChange={(e) => onYearChange(parseInt(e.target.value))}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border bg-white disabled:bg-gray-100 disabled:text-gray-400"
          disabled={disabled}
        >
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>
      
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Month</label>
        <select
          value={month}
          onChange={(e) => onMonthChange(parseInt(e.target.value))}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border bg-white disabled:bg-gray-100 disabled:text-gray-400"
          disabled={disabled}
        >
          {months.map((m) => (
            <option key={m} value={m}>
               {format(new Date(2000, m - 1, 1), "MMMM")}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
