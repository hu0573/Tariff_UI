import React from 'react';
import { useLocation } from 'react-router-dom';

export interface PrintParameterSummaryItem {
  label: string;
  value: React.ReactNode;
}

export interface PrintParameterSummaryProps {
  items: PrintParameterSummaryItem[];
  className?: string;
}

export const PrintParameterSummary: React.FC<PrintParameterSummaryProps> = ({
  items,
  className = '',
}) => {
  const location = useLocation();
  const isPrintMode = location.hash.includes('pdf');

  // Only show in PDF mode
  if (!isPrintMode) return null;

  return (
    <div className={`mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50 text-sm ${className}`}>
      <h3 className="text-gray-900 font-semibold mb-3 border-b border-gray-200 pb-2">
        Report Parameters
      </h3>
      <div className="grid grid-cols-2 gap-y-2 gap-x-4">
        {items.map((item, index) => (
          <div key={index} className="flex flex-col">
            <span className="text-gray-500 text-xs uppercase tracking-wider">
              {item.label}
            </span>
            <span className="text-gray-900 font-medium">
              {item.value || '-'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
