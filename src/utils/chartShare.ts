import {
  configToUrl,
  generateChartConfig,
} from "@/utils/chartConfigParser";
import type { ChartConfig } from "@/utils/chartConfigParser";

export interface ChartSharePayload {
  chartType: string;
  chartName: string;
  path: string;
  params: Record<string, unknown>;
}

export interface BuildUrlOptions extends ChartSharePayload {
  hash?: string;
}

function ensureLeadingSlash(path: string): string {
  if (!path) {
    return "/";
  }
  return path.startsWith("/") ? path : `/${path}`;
}

export function getShareBaseUrl(path: string): string {
  const normalized = ensureLeadingSlash(path);
  return `${window.location.origin}${normalized}`;
}

export function createChartConfig(
  payload: ChartSharePayload
): ChartConfig {
  return generateChartConfig(
    payload.chartType,
    payload.params
  );
}

export function buildUrl(options: BuildUrlOptions): string {
  const config = createChartConfig(options);
  const baseUrl = getShareBaseUrl(options.path);
  return configToUrl(config, baseUrl, options.hash);
}

export async function copyConfig(payload: ChartSharePayload): Promise<string> {
  const config = createChartConfig(payload);
  
  // Clean config for copying: remove nmi for universality
  const cleanConfig = {
    ...config,
    config: { ...config.config }
  };
  if (cleanConfig.config.nmi) {
    delete cleanConfig.config.nmi;
  }
  
  const configJson = JSON.stringify(cleanConfig, null, 2);

  try {
    await navigator.clipboard.writeText(configJson);
    return configJson;
  } catch (error) {
    const textarea = document.createElement("textarea");
    textarea.value = configJson;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
    return configJson;
  }
}
