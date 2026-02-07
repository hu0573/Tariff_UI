import type { Period } from "./types";
import { PERIOD_COLORS } from "./types";

/**
 * 为时段分配颜色
 * 根据period在数组中的位置分配颜色，确保相同period始终使用相同颜色
 */
export function assignPeriodColor(existingPeriods: Period[]): string {
  const periodIndex = existingPeriods.length;
  return PERIOD_COLORS[periodIndex % PERIOD_COLORS.length];
}

/**
 * 为现有时段重新分配颜色
 * 根据period名称分配颜色，确保相同名称的period使用相同颜色
 */
export function assignColorsToPeriods(periods: Period[]): Period[] {
  // 获取所有唯一的period名称
  const uniqueNames = Array.from(new Set(periods.map((p) => p.name)));

  // 为每个唯一名称分配一个颜色
  const nameToColorMap = new Map<string, string>();
  uniqueNames.forEach((name, index) => {
    nameToColorMap.set(name, PERIOD_COLORS[index % PERIOD_COLORS.length]);
  });

  // 为每个period分配对应名称的颜色
  return periods.map((period) => ({
    ...period,
    color: nameToColorMap.get(period.name) || PERIOD_COLORS[0],
  }));
}
