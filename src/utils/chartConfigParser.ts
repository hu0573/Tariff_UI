
// Chart configuration types
export interface ChartConfig {
  chart_type: string;
  config: Record<string, string>; // All values are strings in new format
}

// Default configurations for each chart type
// Note: These are only used when URL params are missing
const DEFAULT_CONFIGS: Record<string, Record<string, string>> = {
  spot_price_graphs: {
    state: "SA",
    price_unit: "$/MWh",
    show_min_max: "true",
    is_relative_time: "true",
    relative_time: "last_full_month",
  },
  "public-holiday-calendar": {
    state: "SA",
    is_relative_time: "true",
    relative_time: "last_full_month",
  },
  billing_calculation: {
    state: "SA",
    is_relative_time: "true",
    relative_time: "last_full_month",
  },
  energy_consumption: {
    state: "SA",
    is_relative_time: "true",
    relative_time: "last_full_month",
  },
};

/**
 * Convert URL search params to chart config JSON.
 */
export function urlParamsToConfig(
  chartType: string,
  searchParams: URLSearchParams
): ChartConfig {
  // Start with defaults if available
  const config: Record<string, string> = DEFAULT_CONFIGS[chartType]
    ? { ...DEFAULT_CONFIGS[chartType] }
    : {};

  // Override with URL params
  for (const [key, value] of searchParams.entries()) {
    if (value && value.trim() !== "") {
      // Map old relative_option to new relative_time for backward compatibility
      if (key === 'relative_option') {
        config['relative_time'] = value;
      } else {
        config[key] = value;
      }
    }
  }

  return {
    chart_type: chartType,
    config,
  };
}

/**
 * Convert chart config JSON to URL search params.
 */
export function configToUrlParams(
  config: ChartConfig["config"]
): URLSearchParams {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(config)) {
    if (typeof value !== "string") {
      throw new Error(
        `Config value for '${key}' must be a string, got ${typeof value}. `
      );
    }

    if (value.trim() !== "") {
      params.set(key, value);
    }
  }

  return params;
}

/**
 * Generate chart config JSON from current URL.
 */
export function urlToConfig(chartType: string): ChartConfig {
  const searchParams = new URLSearchParams(window.location.search);
  return urlParamsToConfig(chartType, searchParams);
}

/**
 * Generate URL from chart config.
 */
export function configToUrl(
  chartConfig: ChartConfig,
  baseUrl: string,
  hash?: string
): string {
  const params = configToUrlParams(chartConfig.config);
  const url = `${baseUrl}?${params.toString()}`;
  return hash ? `${url}${hash}` : url;
}

/**
 * Generate chart config JSON from component state.
 */
export function generateChartConfig(
  chartType: string,
  state: Record<string, any>
): ChartConfig {
  const config: Record<string, string> = {};
  
  const isRelative = state.is_relative_time === true || state.is_relative_time === "true";

  // Convert all values to strings (generic conversion)
  for (let [key, value] of Object.entries(state)) {
    // Skip undefined and null
    if (value === undefined || value === null) {
      continue;
    }

    // Standardize: relative_option -> relative_time
    if (key === 'relative_option') {
      key = 'relative_time';
    }

    // Standardize: relative time excludes timestamps
    if (isRelative && (key === 'start_utc_timestamp' || key === 'end_utc_timestamp')) {
      continue;
    }

    // Convert to string based on type
    if (typeof value === "string") {
      config[key] = value;
    } else if (typeof value === "boolean") {
      config[key] = value ? "true" : "false";
    } else if (typeof value === "number") {
      config[key] = String(value);
    } else if (Array.isArray(value)) {
      config[key] = value.join(",");
    } else {
      config[key] = String(value);
    }
  }

  return {
    chart_type: chartType,
    config,
  };
}
