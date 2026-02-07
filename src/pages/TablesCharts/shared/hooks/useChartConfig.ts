/**
 * Chart configuration management hook
 * Provides utilities for generating and managing chart configurations
 */

import { useState, useCallback } from 'react';
import { copyConfig as copyChartConfig, createChartConfig } from '@/utils/chartShare';
import type { ChartSharePayload } from '@/utils/chartShare';
import type { ChartConfig } from '@/utils/chartConfigParser';

export interface UseChartConfigResult {
  getConfig: (payload: ChartSharePayload) => ChartConfig; // No longer async as createChartConfig is synchronous
  copyConfig: (payload: ChartSharePayload) => Promise<boolean>;
  isCopying: boolean;
  error: Error | null;
}

/**
 * Hook to manage chart configuration
 */
export function useChartConfig(): UseChartConfigResult {
  const [isCopying, setIsCopying] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Get chart configuration object
   */
  const getConfig = useCallback((payload: ChartSharePayload): ChartConfig => {
    return createChartConfig(payload);
  }, []);

  /**
   * Copy chart configuration to clipboard
   */
  const copyConfig = useCallback(async (payload: ChartSharePayload): Promise<boolean> => {
    setIsCopying(true);
    setError(null);

    try {
      await copyChartConfig(payload);
      return true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to copy configuration');
      setError(error);
      return false;
    } finally {
      setIsCopying(false);
    }
  }, []);

  return {
    getConfig,
    copyConfig,
    isCopying,
    error,
  };
}
