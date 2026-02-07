import React from "react";
import { TimeSlot } from "./TimeSlot";
import { TIME_SLOT_CONFIG } from "./types";

interface TimeSlotGridProps {
  periods: Array<{
    startSlot: number;
    endSlot: number;
    color: string;
    id: number;
    name: string;
    startTime: string;
    endTime: string;
    price: number;
    description?: string;
  }>;
  dragRange: { start: number; end: number } | null;
  isDragging?: boolean;
  onSlotMouseDown: (slotIndex: number) => void;
  onSlotMouseEnter: (slotIndex: number) => void;
  onSlotMouseUp: (slotIndex: number) => void;
  onSlotClick: (periodId?: number, periodName?: string) => void;
}

/**
 * 时间槽网格组件
 * 显示48个30分钟时间槽的网格布局
 */
export const TimeSlotGrid: React.FC<TimeSlotGridProps> = ({
  periods,
  dragRange,
  isDragging = false,
  onSlotMouseDown,
  onSlotMouseEnter,
  onSlotMouseUp,
  onSlotClick,
}) => {
  // 为每个时间槽确定显示状态
  const getSlotState = (slotIndex: number) => {
    // 检查是否在拖拽选中范围内
    const isInDragRange =
      dragRange && slotIndex >= dragRange.start && slotIndex <= dragRange.end;

    // 检查是否属于某个时段
    const period = periods.find(
      (p) => slotIndex >= p.startSlot && slotIndex < p.endSlot
    );

    return {
      isSelected: isInDragRange || false,
      periodColor: period?.color || undefined,
      periodId: period?.id,
      periodName: period?.name,
      periodStartTime: period?.startTime,
      periodEndTime: period?.endTime,
      periodPrice: period?.price,
      periodDescription: period?.description,
    };
  };

  return (
    <div className="time-slot-grid">
      {Array.from({ length: TIME_SLOT_CONFIG.TOTAL_SLOTS }, (_, index) => {
        const slotState = getSlotState(index);

        return (
          <TimeSlot
            key={index}
            index={index}
            isSelected={slotState.isSelected}
            isDragging={isDragging && slotState.isSelected}
            periodColor={slotState.periodColor}
            periodId={slotState.periodId}
            periodName={slotState.periodName}
            periodStartTime={slotState.periodStartTime}
            periodEndTime={slotState.periodEndTime}
            periodPrice={slotState.periodPrice}
            periodDescription={slotState.periodDescription}
            onMouseDown={onSlotMouseDown}
            onMouseEnter={onSlotMouseEnter}
            onMouseUp={onSlotMouseUp}
            onClick={onSlotClick}
          />
        );
      })}
    </div>
  );
};
