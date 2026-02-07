import React from 'react';
import { useLocation } from 'react-router-dom';
import { ExportButtonGroup, type ExportButtonGroupProps } from './ExportButtonGroup';

export interface StandardPageHeaderProps extends ExportButtonGroupProps {
  title: string;
}

export const StandardPageHeader: React.FC<StandardPageHeaderProps> = ({
  title,
  className = '',
  ...exportProps
}) => {
  const location = useLocation();
  const isPrintMode = location.hash.includes('pdf');
  const isChartMode = location.hash.includes('chart');

  // Hide completely in print or chart mode
  if (isPrintMode || isChartMode) return null;

  return (
    <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 ${className}`}>
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
        {title}
      </h1>
      
      <ExportButtonGroup {...exportProps} />
    </div>
  );
};
