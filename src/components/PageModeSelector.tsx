// Page Mode Selector Component
import React from 'react';

export type PageMode = 'day' | 'week' | 'month';

interface PageModeSelectorProps {
  value: PageMode;
  onChange: (mode: PageMode) => void;
  disabled?: boolean;
}

export const PageModeSelector: React.FC<PageModeSelectorProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const modes: { value: PageMode; label: string }[] = [
    { value: 'day', label: 'By Day' },
    { value: 'week', label: 'By Week' },
    { value: 'month', label: 'By Month' },
  ];

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Page Mode
      </label>
      <div className="flex gap-2">
        {modes.map((mode) => (
          <button
            key={mode.value}
            type="button"
            onClick={() => onChange(mode.value)}
            disabled={disabled}
            className={`px-4 py-2 rounded-lg transition-colors ${
              value === mode.value
                ? 'bg-blue-600 text-white font-medium'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            } ${
              disabled
                ? 'opacity-50 cursor-not-allowed'
                : 'cursor-pointer'
            }`}
          >
            {mode.label}
          </button>
        ))}
      </div>
    </div>
  );
};
