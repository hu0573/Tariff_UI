import React from 'react';
import { Button } from '@/components/common/Button';

export interface ExportButtonGroupProps {
  onCopyConfig?: () => void;
  onExportPDF?: () => void;
  onExportCSV?: () => void;
  isExporting?: boolean;
  isExportingPDF?: boolean;
  isExportingCSV?: boolean;
  showCopyConfig?: boolean;
  showPDF?: boolean;
  showCSV?: boolean;
  className?: string;
}

export const ExportButtonGroup: React.FC<ExportButtonGroupProps> = ({
  onCopyConfig,
  onExportPDF,
  onExportCSV,
  isExporting = false,
  isExportingPDF = false,
  isExportingCSV = false,
  showCopyConfig = true,
  showPDF = true,
  showCSV = true,
  className = '',
}) => {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {showCopyConfig && onCopyConfig && (
        <Button
          onClick={onCopyConfig}
          variant="secondary"
          disabled={isExporting || isExportingPDF || isExportingCSV}
          size="sm"
        >
          Copy Config
        </Button>
      )}
      {showPDF && onExportPDF && (
        <Button
          onClick={onExportPDF}
          loading={isExporting || isExportingPDF}
          disabled={isExporting || isExportingPDF || isExportingCSV}
          size="sm"
        >
          Export PDF
        </Button>
      )}
      {showCSV && onExportCSV && (
        <Button
          onClick={onExportCSV}
          loading={isExporting || isExportingCSV}
          disabled={isExporting || isExportingPDF || isExportingCSV}
          size="sm"
        >
          Export CSV
        </Button>
      )}
    </div>
  );
};
