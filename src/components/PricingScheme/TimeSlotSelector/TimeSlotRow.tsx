import React from "react";
import { TimeSlotGrid } from "./TimeSlotGrid";
import type { Period } from "./types";
import { timeToSlotIndex } from "./DragHandler";

interface TimeSlotRowProps {
  label: string;
  periods: Period[];
  dragRange: { start: number; end: number } | null;
  isDragging?: boolean;
  onSlotMouseDown: (
    slotIndex: number,
    row: "weekday" | "weekend" | "general"
  ) => void;
  onSlotMouseEnter: (slotIndex: number) => void;
  onSlotMouseUp: (slotIndex: number) => void;
  onSlotClick: (periodId?: number, periodName?: string) => void;
  rowType: "weekday" | "weekend" | "general";
}

/**
 * 时间槽行组件
 * 显示一行完整的时间槽（工作日/非工作日/General）
 */
export const TimeSlotRow: React.FC<TimeSlotRowProps> = ({
  label,
  periods,
  dragRange,
  isDragging = false,
  onSlotMouseDown,
  onSlotMouseEnter,
  onSlotMouseUp,
  onSlotClick,
  rowType,
}) => {
  // 将Period转换为网格所需的格式
  const gridPeriods = periods.map((period) => ({
    startSlot: timeToSlotIndex(period.startTime),
    endSlot: timeToSlotIndex(period.endTime),
    color: period.color,
    id: period.id,
    name: period.name,
    startTime: period.startTime,
    endTime: period.endTime,
    price: period.price,
    description: period.description,
  }));

  const handleSlotMouseDown = (slotIndex: number) => {
    onSlotMouseDown(slotIndex, rowType);
  };

  return (
    <div className="time-slot-container">
      <div className="time-slot-label">{label}</div>
      <TimeSlotGrid
        periods={gridPeriods}
        dragRange={dragRange}
        isDragging={isDragging}
        onSlotMouseDown={handleSlotMouseDown}
        onSlotMouseEnter={onSlotMouseEnter}
        onSlotMouseUp={onSlotMouseUp}
        onSlotClick={onSlotClick}
      />
    </div>
  );
};
