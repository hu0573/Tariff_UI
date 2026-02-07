// Type definitions for TimeSlotSelector components

export interface Period {
  id: number;
  name: string;
  startTime: string; // HH:MM
  endTime: string;
  price: number;
  group: 0 | 1 | 2; // 0=General, 1=Weekday, 2=Weekend
  color: string; // 分配的颜色
  description?: string;
}

export interface NewPeriod {
  name: string;
  startTime: string;
  endTime: string;
  price: number;
  group: 0 | 1 | 2;
  description?: string;
}

export interface UpdatePeriod {
  name?: string;
  startTime?: string;
  endTime?: string;
  price?: number;
  group?: 0 | 1 | 2;
  description?: string;
}

export interface TimeSlotSelectorProps {
  periods: Period[];
  enableWeekdayPricing: boolean;
  onPeriodAdd: (period: NewPeriod) => Promise<void>;
  onPeriodUpdate: (periodId: number, period: UpdatePeriod) => Promise<void>;
  onPeriodDelete: (periodId: number) => Promise<void>;
  onPeriodEdit: (periodId: number, periodName?: string) => void;
  saving?: boolean;
  readOnly?: boolean;
}

// 分组后的时段数据
export interface GroupedPeriods {
  general: Period[]; // group = 0
  weekday: Period[]; // group = 1
  weekend: Period[]; // group = 2
}

// 拖拽状态
export interface DragState {
  isDragging: boolean;
  startSlot: number | null;
  endSlot: number | null;
  currentRow: "weekday" | "weekend" | "general" | null;
}

// 时间槽配置
export const TIME_SLOT_CONFIG = {
  TOTAL_SLOTS: 48, // 24小时 * 2 (30分钟间隔)
  SLOT_DURATION: 30, // 分钟
  SLOT_HEIGHT: 40, // px
};

// 预设颜色列表
export const PERIOD_COLORS = [
  "#ff6b6b", // 红色
  "#4ecdc4", // 青色
  "#45b7d1", // 蓝色
  "#f9ca24", // 黄色
  "#f0932b", // 橙色
  "#eb4d4b", // 深红
  "#6c5ce7", // 紫色
  "#a29bfe", // 浅紫
  "#fd79a8", // 粉色
  "#636e72", // 深灰
];
