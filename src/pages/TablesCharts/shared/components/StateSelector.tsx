import React, { useId } from 'react';
import { STATE_OPTIONS } from '@/config/stateTimezones';

export interface StateSelectorProps {
  value: string;
  onChange: (state: string) => void;
  label?: string;
  options?: Array<{ value: string; label: string }>;
}

export const StateSelector: React.FC<StateSelectorProps> = ({
  value,
  onChange,
  label = 'State',
  options,
}) => {
  const optionsToUse = options || STATE_OPTIONS;
  const id = useId();
  return (
    <div className="flex flex-col gap-1">
      {label && <label htmlFor={id} className="text-sm font-medium text-gray-700">{label}</label>}
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border bg-white"
      >
        {optionsToUse.length > 0 ? (
            optionsToUse.map((opt) => (
            <option key={opt.value} value={opt.value}>
                {opt.label}
            </option>
            ))
        ) : (
             <option value={value}>{value || 'Loading...'}</option>
        )}
      </select>
    </div>
  );
};
