/**
 * Chart export hook
 * Handles PDF and CSV export functionality for charts
 */

import { useState, useCallback } from 'react';
import { downloadCSV, generateTimestampedFilename } from '../utils/exportHelpers';

export interface ExportConfig {
  filename?: string;
  includeTimestamp?: boolean;
}

export interface UseChartExportResult {
  isExporting: boolean;
  exportToPDF: (config?: ExportConfig) => Promise<void>;
  exportToCSV: (data: Record<string, any>[], headers?: string[], config?: ExportConfig) => void;
  error: Error | null;
}

/**
 * Hook to handle chart export operations
 */
export function useChartExport(
  defaultFilename: string = 'chart_export'
): UseChartExportResult {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Export chart to PDF
   * This is a placeholder - actual implementation should use the unified export service
   */
  const exportToPDF = useCallback(
    async (config?: ExportConfig) => {
      setIsExporting(true);
      setError(null);

      try {
        const filename = config?.includeTimestamp
          ? generateTimestampedFilename(config.filename || defaultFilename, 'pdf')
          : `${config?.filename || defaultFilename}.pdf`;

        // TODO: Implement actual PDF export using unified export service
        // This should call the backend API endpoint for PDF generation
        console.log('PDF export not yet implemented:', filename);
        
        // Placeholder delay
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (err) {
        const error = err instanceof Error ? err : new Error('PDF export failed');
        setError(error);
        throw error;
      } finally {
        setIsExporting(false);
      }
    },
    [defaultFilename]
  );

  /**
   * Export data to CSV
   */
  const exportToCSV = useCallback(
    (
      data: Record<string, any>[],
      headers?: string[],
      config?: ExportConfig
    ) => {
      setError(null);

      try {
        const filename = config?.includeTimestamp
          ? generateTimestampedFilename(config.filename || defaultFilename, 'csv')
          : `${config?.filename || defaultFilename}.csv`;

        downloadCSV(data, filename, headers);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('CSV export failed');
        setError(error);
        throw error;
      }
    },
    [defaultFilename]
  );

  return {
    isExporting,
    exportToPDF,
    exportToCSV,
    error,
  };
}
