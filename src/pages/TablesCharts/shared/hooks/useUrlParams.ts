/**
 * URL parameters synchronization hook
 * Provides utilities to sync component state with URL search parameters
 */

import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { useCallback } from 'react';

/**
 * Hook to manage URL parameters
 */
export function useUrlParams() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  /**
   * Get a parameter value from URL
   */
  const getParam = useCallback(
    (key: string, defaultValue?: string): string | null => {
      return searchParams.get(key) ?? defaultValue ?? null;
    },
    [searchParams]
  );

  /**
   * Get a numeric parameter value from URL
   */
  const getNumericParam = useCallback(
    (key: string, defaultValue?: number): number | null => {
      const value = searchParams.get(key);
      if (value === null) return defaultValue ?? null;
      const parsed = parseInt(value, 10);
      return isNaN(parsed) ? defaultValue ?? null : parsed;
    },
    [searchParams]
  );

  /**
   * Get a boolean parameter value from URL
   */
  const getBooleanParam = useCallback(
    (key: string, defaultValue: boolean = false): boolean => {
      const value = searchParams.get(key);
      if (value === null) return defaultValue;
      return value === 'true' || value === '1';
    },
    [searchParams]
  );

  /**
   * Helper to update params while preserving hash
   */
  const updateParams = useCallback((newParams: URLSearchParams) => {
    navigate(
      {
        search: newParams.toString(),
        hash: location.hash,
      },
      { replace: true }
    );
  }, [navigate, location.hash]);

  /**
   * Set a single parameter
   */
  const setParam = useCallback(
    (key: string, value: string | number | boolean | null) => {
      const newParams = new URLSearchParams(searchParams);
      if (value === null || value === undefined) {
        newParams.delete(key);
      } else {
        newParams.set(key, String(value));
      }
      updateParams(newParams);
    },
    [searchParams, updateParams]
  );

  /**
   * Set multiple parameters at once
   */
  const setParams = useCallback(
    (params: Record<string, string | number | boolean | null>) => {
      const newParams = new URLSearchParams(searchParams);
      Object.entries(params).forEach(([key, value]) => {
        if (value === null || value === undefined) {
          newParams.delete(key);
        } else {
          newParams.set(key, String(value));
        }
      });
      updateParams(newParams);
    },
    [searchParams, updateParams]
  );

  /**
   * Delete a parameter
   */
  const deleteParam = useCallback(
    (key: string) => {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete(key);
      updateParams(newParams);
    },
    [searchParams, updateParams]
  );

  /**
   * Delete multiple parameters
   */
  const deleteParams = useCallback(
    (keys: string[]) => {
      const newParams = new URLSearchParams(searchParams);
      keys.forEach(key => newParams.delete(key));
      updateParams(newParams);
    },
    [searchParams, updateParams]
  );

  /**
   * Get all parameters as an object
   */
  const getAllParams = useCallback((): Record<string, string> => {
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    return params;
  }, [searchParams]);

  return {
    getParam,
    getNumericParam,
    getBooleanParam,
    setParam,
    setParams,
    deleteParam,
    deleteParams,
    getAllParams,
    searchParams,
  };
}
