// Page Navigation Component (Day mode only for now)
import React from 'react';
import { Button } from './common/Button';

interface PageNavigationProps {
  currentDate: string;
  hasPrevious: boolean;
  hasNext: boolean;
  previousDate?: string | null;
  nextDate?: string | null;
  previousWeek?: string | null;
  nextWeek?: string | null;
  previousMonth?: string | null;
  nextMonth?: string | null;
  onPrevious: () => void;
  onNext: () => void;
  onRefresh?: () => void;
  pageMode: 'day' | 'week' | 'month';
  recordCount?: number;
  timeRange?: string;
  aggregation?: string;
}

export const PageNavigation: React.FC<PageNavigationProps> = ({
  currentDate,
  hasPrevious,
  hasNext,
  onPrevious,
  onNext,
  onRefresh,
  pageMode,
  recordCount,
  timeRange,
  aggregation,
}) => {
  const getNavigationLabels = () => {
    switch (pageMode) {
      case 'day':
        return { previous: '← Previous Day', next: 'Next Day →' };
      case 'week':
        return { previous: '← Previous Week', next: 'Next Week →' };
      case 'month':
        return { previous: '← Previous Month', next: 'Next Month →' };
      default:
        return { previous: '← Previous Page', next: 'Next Page →' };
    }
  };

  const labels = getNavigationLabels();

  return (
    <div className="mb-4 p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Button
            onClick={onPrevious}
            disabled={!hasPrevious}
            variant="secondary"
            size="sm"
          >
            {labels.previous}
          </Button>
          <div className="px-4 py-2 bg-white border border-gray-300 rounded-lg">
            <span className="font-medium text-gray-900">{currentDate}</span>
          </div>
          <Button
            onClick={onNext}
            disabled={!hasNext}
            variant="secondary"
            size="sm"
          >
            {labels.next}
          </Button>
        </div>
        {onRefresh && (
          <Button onClick={onRefresh} variant="secondary" size="sm">
            Refresh
          </Button>
        )}
      </div>
      {recordCount !== undefined && (
        <div className="text-sm text-gray-600">
          <span className="font-medium">Record Count:</span> {recordCount}
          {aggregation && (pageMode === 'week' || pageMode === 'month') && (
            <>
              {' '}
              <span className="text-gray-400">|</span>{' '}
              <span>Aggregation: {aggregation.toUpperCase()}</span>
            </>
          )}
          {timeRange && (
            <>
              {' '}
              <span className="text-gray-400">|</span>{' '}
              <span>{timeRange}</span>
            </>
          )}
        </div>
      )}
    </div>
  );
};
