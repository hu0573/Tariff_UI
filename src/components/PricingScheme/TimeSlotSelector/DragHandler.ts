import { TIME_SLOT_CONFIG } from "./types";

/**
 * 时间槽拖拽处理类
 */
export class DragHandler {
  private isDragging = false;
  private startSlot: number | null = null;
  private endSlot: number | null = null;
  private currentRow: "weekday" | "weekend" | "general" | null = null;

  /**
   * 开始拖拽
   */
  startDrag(slotIndex: number, row: "weekday" | "weekend" | "general") {
    this.isDragging = true;
    this.startSlot = slotIndex;
    this.endSlot = slotIndex;
    this.currentRow = row;
  }

  /**
   * 更新拖拽位置
   */
  updateDrag(slotIndex: number) {
    if (!this.isDragging) return;
    this.endSlot = slotIndex;
  }

  /**
   * 结束拖拽，返回拖拽结果
   */
  endDrag(): {
    startSlot: number;
    endSlot: number;
    row: "weekday" | "weekend" | "general";
  } | null {
    if (!this.isDragging || this.startSlot === null || this.endSlot === null) {
      this.reset();
      return null;
    }

    const result = {
      startSlot: Math.min(this.startSlot, this.endSlot),
      endSlot: Math.max(this.startSlot, this.endSlot),
      row: this.currentRow!,
    };

    this.reset();
    return result;
  }

  /**
   * 重置拖拽状态
   */
  reset() {
    this.isDragging = false;
    this.startSlot = null;
    this.endSlot = null;
    this.currentRow = null;
  }

  /**
   * 获取当前拖拽范围
   */
  getDragRange(): { start: number; end: number } | null {
    if (!this.isDragging || this.startSlot === null || this.endSlot === null) {
      return null;
    }
    return {
      start: Math.min(this.startSlot, this.endSlot),
      end: Math.max(this.startSlot, this.endSlot),
    };
  }

  /**
   * 检查是否正在拖拽
   */
  getIsDragging(): boolean {
    return this.isDragging;
  }

  /**
   * 获取当前拖拽行
   */
  getCurrentRow(): "weekday" | "weekend" | "general" | null {
    return this.currentRow;
  }
}

/**
 * 将时间槽索引转换为时间字符串 (HH:MM)
 */
export function slotIndexToTime(slotIndex: number): string {
  const totalMinutes = slotIndex * TIME_SLOT_CONFIG.SLOT_DURATION;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  // Handle 24:00 case - HTML time input doesn't support 24:00
  if (hours === 24 && minutes === 0) {
    return "23:59";
  }

  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}`;
}

/**
 * 将时间字符串转换为时间槽索引
 * 支持 HH:MM 格式和 ISO 8601 duration 格式 (PTxHyM)
 */
export function timeToSlotIndex(timeString: string): number {
  // 处理 ISO 8601 duration 格式 (PT4H30M, PT8H)
  if (timeString.startsWith("PT")) {
    const hourMatch = timeString.match(/(\d+)H/);
    const minuteMatch = timeString.match(/(\d+)M/);

    const hours = hourMatch ? parseInt(hourMatch[1]) : 0;
    const minutes = minuteMatch ? parseInt(minuteMatch[1]) : 0;

    const totalMinutes = hours * 60 + minutes;
    return Math.floor(totalMinutes / TIME_SLOT_CONFIG.SLOT_DURATION);
  }

  // 处理 HH:MM 格式
  const [hours, minutes] = timeString.split(":").map(Number);

  // Handle 23:59 as 24:00 for slot calculation
  const adjustedHours = hours === 23 && minutes === 59 ? 24 : hours;
  const adjustedMinutes = hours === 23 && minutes === 59 ? 0 : minutes;

  const totalMinutes = adjustedHours * 60 + adjustedMinutes;
  return Math.floor(totalMinutes / TIME_SLOT_CONFIG.SLOT_DURATION);
}

/**
 * 获取拖拽范围内的时段
 */
export function getDragTimeRange(
  startSlot: number,
  endSlot: number
): { startTime: string; endTime: string } {
  return {
    startTime: slotIndexToTime(startSlot),
    endTime: slotIndexToTime(endSlot + 1), // +1 因为是前包后不包
  };
}
