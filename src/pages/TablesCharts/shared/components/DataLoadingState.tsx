import React from 'react';
import { Loading } from '@/components/common/Loading';
import { ErrorMessage as ErrorAlert } from '@/components/common/ErrorMessage';

export interface DataLoadingStateProps {
  isLoading: boolean;
  error: Error | null;
  isEmpty?: boolean;
  children: React.ReactNode;
  emptyMessage?: string;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
}

export const DataLoadingState: React.FC<DataLoadingStateProps> = ({
  isLoading,
  error,
  isEmpty = false,
  children,
  emptyMessage = 'No data available',
  loadingComponent,
  errorComponent,
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8 min-h-[200px]">
        {loadingComponent || <Loading size="lg" text="Loading data..." />}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        {errorComponent || (
          <ErrorAlert message={error.message || 'An error occurred while loading data.'} />
        )}
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="flex justify-center items-center p-8 min-h-[200px] text-gray-500">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return <>{children}</>;
};
