import React from 'react';
import { useLocation } from 'react-router-dom';
import { ChartParameterPanel, type ChartParameterPanelProps } from './ChartParameterPanel';

export interface UnifiedParameterPanelProps extends ChartParameterPanelProps {}

export const UnifiedParameterPanel: React.FC<UnifiedParameterPanelProps> = (props) => {
  const location = useLocation();
  const isPrintMode = location.hash.includes('pdf');
  const isChartMode = location.hash.includes('chart');

  // Hide completely in print or chart mode
  if (isPrintMode || isChartMode) return null;

  return <ChartParameterPanel {...props} />;
};
