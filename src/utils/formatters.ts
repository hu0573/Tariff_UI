/**
 * Format numerical values for display:
 * - Round to nearest integer (no decimals)
 * - Add thousand separators
 * 
 * @param value - High precision float from backend
 * @returns Formatted string (e.g., "1,246")
 */
export const formatDemandValue = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '-';
  
  const rounded = Math.round(value);
  return new Intl.NumberFormat('en-US', { 
    maximumFractionDigits: 0 
  }).format(rounded);
};

/**
 * Format currency values:
 * - Round to nearest integer
 * - Add thousand separators and dollar sign
 */
export const formatCurrencyValue = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '-';
  
  const rounded = Math.round(value);
  return new Intl.NumberFormat('en-US', { 
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0 
  }).format(rounded);
};


