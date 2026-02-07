// Data Source Indicator Component
import React from 'react';
import { Badge } from './common/Badge';

interface DataSourceIndicatorProps {
  source: 'database' | 'cache' | 'download';
  isMonitored?: boolean;
}

export const DataSourceIndicator: React.FC<DataSourceIndicatorProps> = ({
  source,
  isMonitored = false,
}) => {
  const getSourceInfo = () => {
    switch (source) {
      case 'database':
        return {
          label: 'Database',
          color: 'bg-green-100 text-green-800',
        };
      case 'cache':
        return {
          label: 'Cache',
          color: 'bg-yellow-100 text-yellow-800',
        };
      case 'download':
        return {
          label: 'Downloading',
          color: 'bg-blue-100 text-blue-800',
        };
      default:
        return {
          label: 'Unknown',
          color: 'bg-gray-100 text-gray-800',
        };
    }
  };

  const sourceInfo = getSourceInfo();

  return (
    <div className="mb-4 flex items-center gap-2">
      <span className="text-sm font-medium text-gray-700">Data Source:</span>
      <Badge className={sourceInfo.color}>{sourceInfo.label}</Badge>
      {isMonitored && (
        <Badge className="bg-purple-100 text-purple-800">Monitored</Badge>
      )}
    </div>
  );
};
