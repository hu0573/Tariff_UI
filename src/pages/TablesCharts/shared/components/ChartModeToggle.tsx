import React from 'react';
import { Button } from '@/components/common/Button';

export interface ChartModeToggleProps {
  isPrintMode: boolean;
  isChartMode: boolean;
  onTogglePrint: () => void;
  onToggleChart: () => void;
  className?: string;
}

export const ChartModeToggle: React.FC<ChartModeToggleProps> = ({
  isPrintMode,
  isChartMode,
  onTogglePrint,
  onToggleChart,
  className = '',
}) => {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Button
        onClick={onToggleChart}
        variant={isChartMode ? 'primary' : 'ghost'}
        size="sm"
        disabled={isPrintMode}
      >
        {isChartMode ? 'Exit Chart Mode' : 'Chart Mode'}
      </Button>
      <Button
        onClick={onTogglePrint}
        variant={isPrintMode ? 'primary' : 'ghost'}
        size="sm"
        disabled={isChartMode}
      >
        {isPrintMode ? 'Exit Print Mode' : 'Print Mode'}
      </Button>
    </div>
  );
};
