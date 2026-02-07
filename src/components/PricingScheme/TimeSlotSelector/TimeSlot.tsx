import React from "react";
import { TIME_SLOT_CONFIG } from "./types";
import { Tooltip } from "@/components/common/Tooltip";

interface TimeSlotProps {
  index: number;
  isSelected: boolean;
  isDragging?: boolean;
  periodColor?: string;
  periodId?: number;
  periodName?: string;
  periodStartTime?: string;
  periodEndTime?: string;
  periodPrice?: number;
  periodDescription?: string;
  onMouseDown: (index: number) => void;
  onMouseEnter: (index: number) => void;
  onMouseUp: (index: number) => void;
  onClick: (periodId?: number, periodName?: string) => void;
  className?: string;
}

/**
 * 单个时间槽组件
 * 代表30分钟的时间段
 */
export const TimeSlot: React.FC<TimeSlotProps> = ({
  index,
  isSelected,
  isDragging = false,
  periodColor,
  periodId,
  periodName,
  periodStartTime,
  periodEndTime,
  periodPrice,
  periodDescription,
  onMouseDown,
  onMouseEnter,
  onMouseUp,
  onClick,
  className = "",
}) => {
  const [mouseDownTime, setMouseDownTime] = React.useState<number>(0);
  const [hasMoved, setHasMoved] = React.useState<boolean>(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setMouseDownTime(Date.now());
    setHasMoved(false);
    onMouseDown(index);
  };

  const handleMouseEnter = () => {
    setHasMoved(true);
    onMouseEnter(index);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    e.preventDefault();

    const timeDiff = Date.now() - mouseDownTime;
    const isClick = timeDiff < 200 && !hasMoved; // 200ms 内且没有移动认为是点击

    if (isClick) {
      // 点击事件：如果有时间段，打开编辑页面
      if (periodId) {
        onClick(periodId, periodName);
      } else {
        // If empty slot clicked, trigger empty click
        onClick(undefined, undefined);
      }
      // 如果没有时间段，不做任何事
    } else {
      // 拖拽结束事件
      onMouseUp(index);
    }
  };

  // Generate tooltip content for period
  const getTooltipContent = () => {
    if (!periodName) return null;

    const content = `${periodName}\n${periodStartTime} - ${periodEndTime}\nPrice: ${periodPrice?.toFixed(
      4
    )} AUD/kWh`;
    if (periodDescription) {
      return `${content}\n${periodDescription}`;
    }
    return content;
  };

  const tooltipContent = getTooltipContent();

  const timeSlotElement = (
    <div
      className={`
        time-slot
        ${isSelected ? "selected" : ""}
        ${isDragging ? "dragging" : ""}
        ${className}
      `}
      style={{
        backgroundColor: periodColor || "#f0f0f0",
        height: `${TIME_SLOT_CONFIG.SLOT_HEIGHT}px`,
        cursor: "pointer",
        userSelect: "none",
      }}
      onMouseDown={handleMouseDown}
      onMouseEnter={handleMouseEnter}
      onMouseUp={handleMouseUp}
    />
  );

  return tooltipContent ? (
    <Tooltip content={tooltipContent} position="top">
      {timeSlotElement}
    </Tooltip>
  ) : (
    timeSlotElement
  );
};
