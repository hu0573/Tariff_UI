import React from 'react';

export interface DateRangeSelectorProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (val: string) => void;
  onEndDateChange: (val: string) => void;
  disabled?: boolean;
  minDate?: string;
  maxDate?: string;
}

export const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  disabled = false,
  minDate,
  maxDate
}) => {
  return (
    <div className={`grid grid-cols-2 gap-2 transition-opacity duration-200 ${disabled ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input 
                type="date" 
                value={startDate} 
                onChange={(e) => onStartDateChange(e.target.value)}
                disabled={disabled}
                min={minDate}
                max={maxDate}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
            />
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input 
                type="date" 
                value={endDate} 
                onChange={(e) => onEndDateChange(e.target.value)}
                disabled={disabled}
                min={minDate}
                max={maxDate}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
            />
        </div>
    </div>
  );
};
