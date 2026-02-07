import React, { useState, useCallback, useMemo, useEffect } from "react";
import { TimeSlotRow } from "./TimeSlotRow";
import { DragHandler, getDragTimeRange, slotIndexToTime } from "./DragHandler";
import { assignColorsToPeriods } from "./colorUtils";
import type { TimeSlotSelectorProps, GroupedPeriods, NewPeriod } from "./types";
import "./styles.css";

// TimeSlotSelector now delegates modal handling to parent component

/**
 * TimeSlotSelector main component
 * Supports single-row/double-row display, dynamically switches based on Enable Weekday Pricing status
 */
export const TimeSlotSelector: React.FC<TimeSlotSelectorProps> = ({
  periods,
  enableWeekdayPricing,
  onPeriodAdd,
  onPeriodEdit,
  saving = false,
  readOnly = false,
}) => {
  // State management
  const [dragHandler] = useState(() => new DragHandler());
  const [dragRange, setDragRange] = useState<{
    start: number;
    end: number;
  } | null>(null);

  // Assign colors to periods
  const periodsWithColors = useMemo(
    () => assignColorsToPeriods(periods),
    [periods]
  );

  // Organize period data by groups
  const groupedPeriods = useMemo((): GroupedPeriods => {
    const grouped: GroupedPeriods = {
      general: [],
      weekday: [],
      weekend: [],
    };

    periodsWithColors.forEach((period) => {
      switch (period.group) {
        case 1:
          grouped.weekday.push(period);
          break;
        case 2:
          grouped.weekend.push(period);
          break;
        default:
          // Fallback for legacy data (period_group = 0 = General)
          if (period.group === 0) {
            grouped.general.push(period);
          }
          break;
      }
    });

    return grouped;
  }, [periodsWithColors]);

  // Handle mouse down
  const handleSlotMouseDown = useCallback(
    (slotIndex: number, row: "weekday" | "weekend" | "general") => {
      if (readOnly) return;
      dragHandler.startDrag(slotIndex, row);
      setDragRange({ start: slotIndex, end: slotIndex });
    },
    [dragHandler, readOnly]
  );

  // Handle mouse enter
  const handleSlotMouseEnter = useCallback(
    (slotIndex: number) => {
      if (readOnly) return;
      if (dragHandler.getIsDragging()) {
        dragHandler.updateDrag(slotIndex);
        const range = dragHandler.getDragRange();
        if (range) {
          setDragRange(range);
        }
      }
    },
    [dragHandler, readOnly]
  );

  // Handle mouse up
  const handleSlotMouseUp = useCallback(() => {
    if (readOnly) return;
    const dragResult = dragHandler.endDrag();
    if (dragResult) {
      const timeRange = getDragTimeRange(
        dragResult.startSlot,
        dragResult.endSlot
      );
      const group =
        dragResult.row === "weekday" ? 1 : dragResult.row === "weekend" ? 2 : 0;

      // Create new period data and call parent handler
      const newPeriod: NewPeriod = {
        name: "",
        startTime: timeRange.startTime,
        endTime: timeRange.endTime,
        price: 0,
        group,
        description: "",
      };

      onPeriodAdd(newPeriod);
    }
    setDragRange(null);
  }, [dragHandler, onPeriodAdd, readOnly]);

  // Handle time slot click
  const handleSlotClick = useCallback(
    (periodId: number, periodName: string) => {
      if (readOnly) return;
      onPeriodEdit(periodId, periodName);
    },
    [onPeriodEdit, readOnly]
  );

  // Handle global mouse up (prevent state anomalies when mouse leaves component)
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (dragHandler.getIsDragging()) {
        dragHandler.reset();
        setDragRange(null);
      }
    };

    document.addEventListener("mouseup", handleGlobalMouseUp);
    return () => document.removeEventListener("mouseup", handleGlobalMouseUp);
  }, [dragHandler]);

  // Render time axis labels with absolute positioning to match exact grid coordinates
  const renderTimeAxis = () => (
    <div 
      className="time-axis" 
      style={{ 
        display: 'block', 
        position: 'relative', 
        padding: '0 8px', // Match the 8px padding of .time-slot-grid
        height: '24px'
      }}
    >
      {[0, 6, 12, 18, 24].map((hour) => {
        const percentage = (hour / 24) * 100;
        
        let transform = 'translateX(-50%)';
        if (hour === 0) transform = 'translateX(0)';
        if (hour === 24) transform = 'translateX(-100%)';

        return (
          <div 
            key={hour} 
            style={{ 
              position: 'absolute',
              left: `${percentage}%`,
              transform,
              whiteSpace: 'nowrap'
            }}
          >
            {hour.toString().padStart(2, "0")}:00
          </div>
        );
      })}
    </div>
  );

  return (
    <div className={`time-slot-selector ${saving ? "saving" : ""} ${readOnly ? "read-only" : ""}`}>
      {/* Drag hint - hidden in readOnly mode */}
      {!readOnly && (
        <div className="drag-hint">
          {saving ? (
            <span>Saving...</span>
          ) : dragRange ? (
            <span>
              Currently selected {slotIndexToTime(dragRange.start)}-
              {slotIndexToTime(dragRange.end + 1)}
            </span>
          ) : (
            <span>Drag to select a time range to set</span>
          )}
        </div>
      )}

      {/* Display different layouts based on Enable Weekday Pricing status */}
      {periods.length === 0 ? (
        /* Empty state - show time slots for user interaction */
        <>
          <div className="empty-state-hint">
            <div className="empty-icon">🕒</div>
            <h3>No pricing periods</h3>
            <p>
              Drag to select a time range to create your first pricing period
            </p>
          </div>
          {enableWeekdayPricing ? (
            <>
              {/* Weekday */}
              <TimeSlotRow
                label="Weekday"
                periods={[]}
                dragRange={dragRange}
                isDragging={dragHandler.getIsDragging()}
                onSlotMouseDown={handleSlotMouseDown}
                onSlotMouseEnter={handleSlotMouseEnter}
                onSlotMouseUp={handleSlotMouseUp}
                onSlotClick={handleSlotClick}
                rowType="weekday"
              />
              {renderTimeAxis()}

              {/* Weekend */}
              <TimeSlotRow
                label="Weekend"
                periods={[]}
                dragRange={dragRange}
                isDragging={dragHandler.getIsDragging()}
                onSlotMouseDown={handleSlotMouseDown}
                onSlotMouseEnter={handleSlotMouseEnter}
                onSlotMouseUp={handleSlotMouseUp}
                onSlotClick={handleSlotClick}
                rowType="weekend"
              />
              {renderTimeAxis()}
            </>
          ) : (
            <>
              <TimeSlotRow
                label=""
                periods={[]}
                dragRange={dragRange}
                isDragging={dragHandler.getIsDragging()}
                onSlotMouseDown={handleSlotMouseDown}
                onSlotMouseEnter={handleSlotMouseEnter}
                onSlotMouseUp={handleSlotMouseUp}
                onSlotClick={handleSlotClick}
                rowType="general"
              />
              {renderTimeAxis()}
            </>
          )}
        </>
      ) : enableWeekdayPricing ? (
        /* Double-row mode: weekday and weekend */
        <>
          {/* 工作日 (Weekday) */}
          <TimeSlotRow
            label="Weekday"
            periods={groupedPeriods.weekday}
            dragRange={dragRange}
            isDragging={dragHandler.getIsDragging()}
            onSlotMouseDown={handleSlotMouseDown}
            onSlotMouseEnter={handleSlotMouseEnter}
            onSlotMouseUp={handleSlotMouseUp}
            onSlotClick={handleSlotClick}
            rowType="weekday"
          />
          {renderTimeAxis()}

          {/* 非工作日 (Weekend) */}
          <TimeSlotRow
            label="Weekend"
            periods={groupedPeriods.weekend}
            dragRange={dragRange}
            isDragging={dragHandler.getIsDragging()}
            onSlotMouseDown={handleSlotMouseDown}
            onSlotMouseEnter={handleSlotMouseEnter}
            onSlotMouseUp={handleSlotMouseUp}
            onSlotClick={handleSlotClick}
            rowType="weekend"
          />
          {renderTimeAxis()}
        </>
      ) : (
        /* 单行模式：通用时段 */
        <>
          <TimeSlotRow
            label=""
            periods={groupedPeriods.general}
            dragRange={dragRange}
            isDragging={dragHandler.getIsDragging()}
            onSlotMouseDown={handleSlotMouseDown}
            onSlotMouseEnter={handleSlotMouseEnter}
            onSlotMouseUp={handleSlotMouseUp}
            onSlotClick={handleSlotClick}
            rowType="general"
          />
          {renderTimeAxis()}
        </>
      )}
    </div>
  );
};
