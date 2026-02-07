import React, { useMemo } from 'react';
import { ChartParameterPanel } from '../../shared/components/ChartParameterPanel';
import { NMISelector, type NMIItem } from '@/components/NMISelector';
import { StateSelector } from '../../shared/components/StateSelector';
import { TimeRangeSelector } from '../../shared/components/TimeRangeSelector';
import { RelativeTimeSelector } from '../../shared/components/RelativeTimeSelector';
import type { BillingParameterPanelProps } from '../BillingCalculation.types'; // Ensure types match or cast

export const BillingParameterPanel: React.FC<BillingParameterPanelProps> = ({
  nmi,
  selectedYear,
  selectedMonth,
  isRelativeTime,
  relativeOption,
  selectedState,
  availableYears,
  nmiItems,
  isLoadingNMI,
  onNmiChange,
  onYearChange,
  onMonthChange,
  onRelativeTimeToggle,
  onRelativeOptionChange,
  onStateChange,
}) => {
  // Use a fixed set of available months
  const availableMonths = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);

  return (
    <ChartParameterPanel title="Billing Parameters">
      <NMISelector
        value={nmi}
        onChange={onNmiChange}
        nmis={nmiItems as NMIItem[]}
        isLoading={isLoadingNMI}
      />
      <StateSelector
        value={selectedState}
        onChange={onStateChange}
      />
      
      <div className="flex flex-col gap-4 border-l border-gray-200 pl-4">
        <RelativeTimeSelector
          enabled={isRelativeTime}
          value={relativeOption}
          options={[
            { value: 'last_full_month', label: 'Last Full Month' },
            { value: 'last_full_year', label: 'Last Full Year' },
          ]}
          onToggle={onRelativeTimeToggle}
          onChange={onRelativeOptionChange}
        />
        
        {!isRelativeTime && (
          <TimeRangeSelector
            year={selectedYear}
            month={selectedMonth}
            availableMonths={availableMonths}
            availableYears={availableYears}
            onYearChange={onYearChange}
            onMonthChange={onMonthChange}
          />
        )}
      </div>
    </ChartParameterPanel>
  );
};
