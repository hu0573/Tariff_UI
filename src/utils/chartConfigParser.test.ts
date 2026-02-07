import { describe, it, expect } from 'vitest';
import { urlParamsToConfig, configToUrlParams, generateChartConfig } from './chartConfigParser';

describe('chartConfigParser', () => {
  describe('urlParamsToConfig', () => {
    it('should parse URL params into config object', () => {
      const params = new URLSearchParams('state=NSW&show_min_max=true');
      const result = urlParamsToConfig('spot_price_graphs', params);
      
      expect(result.chart_type).toBe('spot_price_graphs');
      expect(result.config.state).toBe('NSW');
      expect(result.config.show_min_max).toBe('true');
    });

    it('should use default values for missing params', () => {
      const params = new URLSearchParams('');
      const result = urlParamsToConfig('spot_price_graphs', params);
      
      expect(result.config.state).toBe('SA'); // Default from chartConfigParser.ts
      expect(result.config.price_unit).toBe('$/MWh');
    });

    it('should map relative_option to relative_time for backward compatibility', () => {
      const params = new URLSearchParams('relative_option=last_7_days');
      const result = urlParamsToConfig('spot_price_graphs', params);
      
      expect(result.config.relative_time).toBe('last_7_days');
    });
  });

  describe('configToUrlParams', () => {
    it('should convert config object back to URL search params', () => {
      const config = { state: 'QLD', is_relative_time: 'false' };
      const params = configToUrlParams(config);
      
      expect(params.get('state')).toBe('QLD');
      expect(params.get('is_relative_time')).toBe('false');
    });
  });

  describe('generateChartConfig', () => {
    it('should generate config from component state', () => {
      const state = {
        state: 'VIC',
        is_relative_time: true,
        relative_option: 'last_month',
        start_utc_timestamp: 12345678, // Should be excluded if relative is true
      };
      
      const result = generateChartConfig('energy_consumption', state);
      
      expect(result.config.state).toBe('VIC');
      expect(result.config.is_relative_time).toBe('true');
      expect(result.config.relative_time).toBe('last_month');
      expect(result.config.start_utc_timestamp).toBeUndefined();
    });

    it('should include timestamps if relative is false', () => {
      const state = {
        is_relative_time: false,
        start_utc_timestamp: 12345678,
      };
      
      const result = generateChartConfig('energy_consumption', state);
      
      expect(result.config.is_relative_time).toBe('false');
      expect(result.config.start_utc_timestamp).toBe('12345678');
    });
  });
});
