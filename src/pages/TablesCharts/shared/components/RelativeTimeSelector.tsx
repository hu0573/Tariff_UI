import React from 'react';

export interface RelativeTimeSelectorProps {
  enabled: boolean;
  value: string;
  options: Array<{ value: string; label: string }>;
  onToggle: (enabled: boolean) => void;
  onChange: (value: string) => void;
  label?: string;
}

export const RelativeTimeSelector: React.FC<RelativeTimeSelectorProps> = ({
  enabled,
  value,
  options,
  onToggle,
  onChange,
  label = 'Relative Time'
}) => {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between h-[24px]"> {/* Match generic label height */}
           <label className="text-sm font-medium text-gray-700">{label}</label>
           <div className="flex items-center">
                <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => onToggle(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                    id={`relative-time-toggle-${label}`}
                />
                <label 
                    htmlFor={`relative-time-toggle-${label}`} 
                    className="ml-2 text-sm text-gray-500 cursor-pointer select-none"
                >
                    Enable
                </label>
           </div>
      </div>
      
      <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={!enabled}
          className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border bg-white ${!enabled ? 'bg-gray-100 text-gray-400' : ''}`}
      >
          {options.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
      </select>
    </div>
  );
};
