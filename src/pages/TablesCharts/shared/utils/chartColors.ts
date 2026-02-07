/**
 * Chart color configuration utilities
 * Provides consistent color schemes across all TablesCharts pages
 */

/**
 * Standard color palette for charts
 */
export const CHART_COLORS = {
  primary: '#3b82f6',
  secondary: '#8b5cf6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
  gray: '#6b7280',
} as const;

/**
 * Color palette for energy period charts
 */
export const PERIOD_COLORS = {
  peak: '#ef4444',      // Red
  shoulder: '#f59e0b',  // Orange
  offpeak: '#10b981',   // Green
  solar: '#fbbf24',     // Yellow
  controlled: '#8b5cf6', // Purple
  default: '#6b7280',   // Gray
} as const;

/**
 * Color palette for billing charts
 */
export const BILLING_COLORS = {
  buy: '#ef4444',       // Red (costs)
  sell: '#10b981',      // Green (revenue)
  net: '#3b82f6',       // Blue (net)
  fixed: '#8b5cf6',     // Purple (fixed charges)
  variable: '#f59e0b',  // Orange (variable charges)
} as const;

/**
 * Generate a color scale for price heatmaps from billing perspective
 * Negative values (bill reduction/credit) = green (good)
 * Positive values (bill increase/cost) = red (bad)
 */
export function getPriceHeatmapColor(
  value: number,
  maxAbsValue: number
): string {
  if (maxAbsValue === 0) return 'rgb(255, 255, 255)';
  
  const normalized = value / maxAbsValue; // -1 to 1
  
  if (normalized < 0) {
    // Negative (bill reduction): white to deep green
    const intensity = Math.abs(normalized);
    const r = Math.round(255 * (1 - intensity * 0.9));
    const g = Math.round(255 * (1 - intensity * 0.3));
    const b = Math.round(255 * (1 - intensity * 0.8));
    return `rgb(${r}, ${g}, ${b})`;
  } else {
    // Positive (bill increase): white to deep red
    const intensity = normalized;
    const r = 255;
    const g = Math.round(255 * (1 - intensity * 0.8));
    const b = Math.round(255 * (1 - intensity * 0.8));
    return `rgb(${r}, ${g}, ${b})`;
  }
}

/**
 * Generate a color scale for demand heatmap
 * From light blue (low) to dark red (high)
 */
export function getDemandHeatmapColor(
  value: number,
  minValue: number,
  maxValue: number
): string {
  if (maxValue === minValue) return 'rgb(200, 200, 255)';
  
  const normalized = (value - minValue) / (maxValue - minValue); // 0 to 1
  
  if (normalized < 0.33) {
    // Low: light blue to medium blue
    const t = normalized / 0.33;
    const r = Math.round(200 - 100 * t);
    const g = Math.round(200 - 100 * t);
    const b = 255;
    return `rgb(${r}, ${g}, ${b})`;
  } else if (normalized < 0.67) {
    // Medium: medium blue to yellow
    const t = (normalized - 0.33) / 0.34;
    const r = Math.round(100 + 155 * t);
    const g = Math.round(100 + 155 * t);
    const b = Math.round(255 - 155 * t);
    return `rgb(${r}, ${g}, ${b})`;
  } else {
    // High: yellow to dark red
    const t = (normalized - 0.67) / 0.33;
    const r = Math.round(255 - 55 * t);
    const g = Math.round(255 - 255 * t);
    const b = 100;
    return `rgb(${r}, ${g}, ${b})`;
  }
}

/**
 * Get color for a specific period name
 */
export function getPeriodColor(periodName: string): string {
  const lowerName = periodName.toLowerCase();
  
  if (lowerName.includes('peak') && !lowerName.includes('off')) {
    return PERIOD_COLORS.peak;
  }
  if (lowerName.includes('shoulder')) {
    return PERIOD_COLORS.shoulder;
  }
  if (lowerName.includes('offpeak') || lowerName.includes('off-peak')) {
    return PERIOD_COLORS.offpeak;
  }
  if (lowerName.includes('solar')) {
    return PERIOD_COLORS.solar;
  }
  if (lowerName.includes('controlled')) {
    return PERIOD_COLORS.controlled;
  }
  
  return PERIOD_COLORS.default;
}

/**
 * Generate an array of colors for multiple series
 */
export function generateSeriesColors(count: number): string[] {
  const baseColors = [
    CHART_COLORS.primary,
    CHART_COLORS.secondary,
    CHART_COLORS.success,
    CHART_COLORS.warning,
    CHART_COLORS.danger,
    CHART_COLORS.info,
  ];
  
  const colors: string[] = [];
  for (let i = 0; i < count; i++) {
    colors.push(baseColors[i % baseColors.length]);
  }
  
  return colors;
}
