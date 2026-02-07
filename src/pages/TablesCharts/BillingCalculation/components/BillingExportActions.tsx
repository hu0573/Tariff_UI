import React from 'react';
import { ExportButtonGroup } from '../../shared/components/ExportButtonGroup';
import type { BillingExportActionsProps } from '../BillingCalculation.types';

export const BillingExportActions: React.FC<BillingExportActionsProps> = ({
  onCopyConfig,
  onExportPDF,
  onExportCSV,
  isExportingPDF,
  isExportingCSV,
  copySuccess,
  hasData,
}) => {
  return (
    <div className="flex items-center justify-end gap-2 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center gap-2">
        {copySuccess && (
          <span className="text-green-600 text-sm animate-fade-in font-medium">
            Copied!
          </span>
        )}
        <ExportButtonGroup
          onCopyConfig={onCopyConfig}
          onExportPDF={onExportPDF}
          onExportCSV={onExportCSV}
          isExportingPDF={isExportingPDF}
          isExportingCSV={isExportingCSV}
          showCopyConfig={true}
          showPDF={true}
          showCSV={hasData}
        />
      </div>
    </div>
  );
};
