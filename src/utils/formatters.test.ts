import { describe, it, expect } from 'vitest';
import { formatDemandValue, formatCurrencyValue } from './formatters';

describe('formatters', () => {
  describe('formatDemandValue', () => {
    it('should round to the nearest integer and add thousand separators', () => {
      expect(formatDemandValue(1234.56)).toBe('1,235');
      expect(formatDemandValue(1234.44)).toBe('1,234');
      expect(formatDemandValue(0)).toBe('0');
      expect(formatDemandValue(1000000)).toBe('1,000,000');
    });

    it('should return "-" for null or undefined', () => {
      expect(formatDemandValue(null)).toBe('-');
      expect(formatDemandValue(undefined)).toBe('-');
    });
  });

  describe('formatCurrencyValue', () => {
    it('should round to the nearest integer and add thousand separators with $ sign', () => {
      // Note: Intl.NumberFormat depends on locale, but standard en-US format is expected
      expect(formatCurrencyValue(1234.56)).toContain('$1,235');
      expect(formatCurrencyValue(1234.44)).toContain('$1,234');
      expect(formatCurrencyValue(0)).toContain('$0');
    });

    it('should return "-" for null or undefined', () => {
      expect(formatCurrencyValue(null)).toBe('-');
      expect(formatCurrencyValue(undefined)).toBe('-');
    });
  });
});
