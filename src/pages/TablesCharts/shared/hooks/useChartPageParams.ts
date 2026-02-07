
import { useMemo, useCallback, useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { useUrlParams } from './useUrlParams';

export interface UseChartPageParamsReturn<T = Record<string, any>> {
  // Core State
  nmi: string;
  state: string;
  year: number;
  month: number;
  startDate: string;
  endDate: string;
  isRelativeTime: boolean;
  relativeTime: string;

  // Custom State (Typed)
  extraParams: T;

  // Setters (Unified)
  setNmi: (val: string) => void;
  setState: (val: string) => void;
  setYear: (val: number) => void;
  setMonth: (val: number) => void;
  setStartDate: (val: string) => void;
  setEndDate: (val: string) => void;
  setIsRelativeTime: (val: boolean) => void;
  setRelativeTime: (val: string) => void;
  setExtraParams: (newParams: Partial<T>) => void;
  setParams: (params: Record<string, string | number | boolean | null>) => void;

  // Computed / Helpers
  isPrintMode: boolean;
  isChartMode: boolean;

  // Full Configuration for Export/Copy
  currentConfig: any;
}

export function useChartPageParams<T extends Record<string, any> = Record<string, any>>(
  initialExtraParams?: T,
  options: { storageKeyPrefix?: string; defaults?: { isRelativeTime?: boolean } } = {}
): UseChartPageParamsReturn<T> {
  const { storageKeyPrefix = 'chart' } = options;
  const location = useLocation();
  const [params] = useSearchParams();
  const { setParam, setParams, getAllParams } = useUrlParams();

  // Mode detection
  const isPrintMode = location.hash.includes('pdf');
  const isChartMode = location.hash.includes('chart');

  // Core State Initialization directly from useSearchParams to ensure re-renders
  const nmi = params.get('nmi') || '';
  const state = params.get('state') || 'SA';
  
  const currentDate = new Date();
  const year = parseInt(params.get('year') || '') || currentDate.getFullYear();
  const month = parseInt(params.get('month') || '') || (currentDate.getMonth() + 1);
  
  const startDate = params.get('start_date') || params.get('startDate') || '';
  const endDate = params.get('end_date') || params.get('endDate') || '';

  // Relative Time Logic
  const isRelativeTimeRaw = params.get('is_relative_time');
  const isRelativeTime = isRelativeTimeRaw === 'true' || (isRelativeTimeRaw === null && (options.defaults?.isRelativeTime ?? false));
  const relativeTime = params.get('relative_time') || params.get('relative_option') || 'last_full_month';

  // Extra Params Initialization
  const allParams = getAllParams();
  const extraParams = useMemo(() => {
    const combined = { ...initialExtraParams } as T;
    const CORE_PARAMS = ['nmi', 'state', 'year', 'month', 'is_relative_time', 'relative_time', 'relative_option', 'start_date', 'end_date', 'startDate', 'endDate'];
    
    // Pick up everything from URL that isn't a core param
    Object.keys(allParams).forEach(key => {
        if (!CORE_PARAMS.includes(key)) {
            (combined as any)[key] = allParams[key];
        }
    });

    // Apply type casting for keys defined in initialExtraParams
    if (initialExtraParams) {
        Object.keys(initialExtraParams).forEach((key) => {
            const val = allParams[key];
            if (val !== undefined) {
                 const initVal = initialExtraParams[key];
                 if (typeof initVal === 'boolean') {
                     (combined as any)[key] = val === 'true';
                 } else if (typeof initVal === 'number') {
                     const num = Number(val);
                     if (!isNaN(num)) (combined as any)[key] = num;
                 }
            }
        });
    }
    return combined;
  }, [allParams, initialExtraParams]);

  // Init: Sync defaults to URL if missing, but only if NO time params are present
  useEffect(() => {
    if (options.defaults?.isRelativeTime) {
      const inUrl = params.get('is_relative_time');
      const yearInUrl = params.get('year');
      const monthInUrl = params.get('month');
      const startDateInUrl = params.get('start_date') || params.get('startDate');

      if (inUrl === null && yearInUrl === null && monthInUrl === null && startDateInUrl === null) {
        setParams({
          is_relative_time: 'true',
          relative_time: relativeTime || 'last_full_month',
          year: null, 
          month: null,
          start_date: null,
          end_date: null
        });
      }
    }
  }, []);

  // Setters
  const setNmi = useCallback((val: string) => setParam('nmi', val), [setParam]);
  const setState = useCallback((val: string) => setParam('state', val), [setParam]);

  const setYear = useCallback((val: number) => {
    setParams({ year: val, is_relative_time: 'false', relative_time: null, start_date: null, end_date: null });
  }, [setParams]);

  const setMonth = useCallback((val: number) => {
    setParams({ month: val, is_relative_time: 'false', relative_time: null, start_date: null, end_date: null });
  }, [setParams]);

  const setStartDate = useCallback((val: string) => {
    setParams({ start_date: val, is_relative_time: 'false', relative_time: null, year: null, month: null });
  }, [setParams]);

  const setEndDate = useCallback((val: string) => {
    setParams({ end_date: val, is_relative_time: 'false', relative_time: null, year: null, month: null });
  }, [setParams]);
  
  const setIsRelativeTime = useCallback((val: boolean) => {
      localStorage.setItem(`${storageKeyPrefix}_is_relative_time`, String(val));
      if (val) {
          setParams({ 
              is_relative_time: 'true', 
              relative_time: relativeTime, 
              year: null, 
              month: null,
              start_date: null,
              end_date: null
          });
      } else {
          setParams({ 
              is_relative_time: 'false', 
              relative_time: null,
              year: year,
              month: month,
              start_date: startDate || null,
              end_date: endDate || null
          });
      }
  }, [setParams, storageKeyPrefix, relativeTime, year, month, startDate, endDate]);

  const setRelativeTime = useCallback((val: string) => {
      localStorage.setItem(`${storageKeyPrefix}_relative_time`, val);
      setParams({ 
          relative_time: val, 
          is_relative_time: 'true', 
          year: null, 
          month: null,
          start_date: null,
          end_date: null
      });
  }, [setParams, storageKeyPrefix]);

  const setExtraParamsInternal = useCallback((newParams: Partial<T>) => {
      setParams(newParams as Record<string, string | number | boolean | null>);
  }, [setParams]);

  // Current Config for Sharing
  const currentConfig = useMemo(() => ({
      nmi,
      state,
      year,
      month,
      start_date: startDate,
      end_date: endDate,
      is_relative_time: isRelativeTime,
      relative_time: relativeTime,
      ...extraParams
  }), [nmi, state, year, month, startDate, endDate, isRelativeTime, relativeTime, extraParams]);

  return {
    nmi,
    state,
    year,
    month,
    startDate,
    endDate,
    isRelativeTime,
    relativeTime,
    extraParams,
    setNmi,
    setState,
    setYear,
    setMonth,
    setStartDate,
    setEndDate,
    setIsRelativeTime,
    setRelativeTime,
    setExtraParams: setExtraParamsInternal,
    setParams,
    isPrintMode,
    isChartMode,
    currentConfig
  };
}
