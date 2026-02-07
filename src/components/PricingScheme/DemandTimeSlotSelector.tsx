import React, { useMemo, useState } from "react";
import type { Demand } from "@/api/pricingSchemes";
import { Tooltip } from "@/components/common/Tooltip";
import { TIME_SLOT_CONFIG } from "@/components/PricingScheme/TimeSlotSelector/types";
import {
  slotIndexToTime,
  timeToSlotIndex,
  getDragTimeRange,
} from "@/components/PricingScheme/TimeSlotSelector/DragHandler";
import "@/components/PricingScheme/TimeSlotSelector/styles.css";

interface DemandTimeSlotSelectorProps {
  demands: Demand[];
  onCreateDemandFromRange: (params: {
    startSlot: number;
    endSlot: number;
    startTime: string;
    endTime: string;
  }) => void;
  onEditDemand: (demand: Demand) => void;
  saving?: boolean;
  readOnly?: boolean;
}

const SLOT_COUNT = TIME_SLOT_CONFIG.TOTAL_SLOTS;

const normalizeTime = (value: string): string => {
  if (!value) return "";
  const trimmed = value.trim();

  if (trimmed.includes("T")) {
    const [, timePart] = trimmed.split("T");
    if (timePart) {
      const [h, m] = timePart.split(":");
      const hours = Number.parseInt(h ?? "0", 10) || 0;
      const minutes = Number.parseInt(m ?? "0", 10) || 0;
      return `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}`;
    }
  }

  const [h, m] = trimmed.split(":");
  if (!h) return trimmed;
  const hours = Number.parseInt(h, 10);
  const minutes = Number.parseInt(m ?? "0", 10);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return trimmed;
  }

  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}`;
};

const buildEnabledSlotsFromDemand = (demand: Demand): boolean[] => {
  const base = Array.from({ length: SLOT_COUNT }, () => false);

  // Use start_time and end_time to calculate enabled slots
  const startIndex = timeToSlotIndex(normalizeTime(demand.start_time));
  const endIndexExclusive = timeToSlotIndex(normalizeTime(demand.end_time));
  const startSlot = Math.max(0, Math.min(startIndex, SLOT_COUNT - 1));
  const endSlotExclusive = Math.max(startSlot + 1, Math.min(endIndexExclusive, SLOT_COUNT));

  for (let i = startSlot; i < endSlotExclusive; i += 1) {
    base[i] = true;
  }

  return base;
};

const buildDemandTooltip = (demand: Demand): string => {
  const priceBase = Number(demand.price_base ?? 0);
  const weekdayPricing = demand.weekday_pricing ?? "all_days";
  const weekdayPricingText = {
    all_days: "All days",
    weekday: "Weekday (Monday-Friday, excluding public holidays)",
    weekend: "Weekend (Weekends + Public Holidays)",
  }[weekdayPricing] || weekdayPricing;
  
  const lines = [
    demand.name || "Demand",
    `${normalizeTime(demand.start_time)} - ${normalizeTime(demand.end_time)}`,
    `Price base: $${priceBase.toFixed(4)} / kVA / day`,
    `Months: ${demand.start_month} - ${demand.end_month}`,
    `Lookback: ${demand.lookback_days} days`,
    `Applicable Days: ${weekdayPricingText}`,
  ];
  return lines.join("\n");
};

export const DemandTimeSlotSelector: React.FC<DemandTimeSlotSelectorProps> = ({
  demands,
  onCreateDemandFromRange,
  onEditDemand,
  saving = false,
  readOnly = false,
}) => {
  const [dragRange, setDragRange] = useState<{ start: number; end: number } | null>(
    null
  );
  const [isDragging, setIsDragging] = useState(false);

  // Sort by created_at (if available) to match backend order, otherwise by ID
  const sortedDemands = useMemo(
    () => {
      return [...demands].sort((a, b) => {
        // First try to sort by created_at (ascending)
        if (a.created_at && b.created_at) {
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        }
        // Fallback to ID if created_at is not available
        return a.id - b.id;
      });
    },
    [demands]
  );

  const handlePlaceholderMouseDown = (slotIndex: number) => {
    if (saving || readOnly) return;
    setIsDragging(true);
    setDragRange({ start: slotIndex, end: slotIndex });
  };

  const handlePlaceholderMouseEnter = (slotIndex: number) => {
    if (!isDragging) return;
    setDragRange((prev) =>
      prev
        ? {
            start: prev.start,
            end: slotIndex,
          }
        : { start: slotIndex, end: slotIndex }
    );
  };

  const handlePlaceholderMouseUp = (slotIndex: number) => {
    if (!isDragging || !dragRange) return;

    const startSlot = Math.min(dragRange.start, slotIndex);
    const endSlot = Math.max(dragRange.start, slotIndex);
    const { startTime, endTime } = getDragTimeRange(startSlot, endSlot);

    onCreateDemandFromRange({
      startSlot,
      endSlot,
      startTime,
      endTime,
    });

    setIsDragging(false);
    setDragRange(null);
  };

  const dragHint = saving
    ? "Saving demand configuration..."
    : dragRange
    ? `Currently selected ${slotIndexToTime(dragRange.start)}-${slotIndexToTime(
        dragRange.end + 1
      )}`
    : demands.length === 0
    ? "Drag across the timeline to create a new demand configuration."
    : "Drag across the empty row below to add another demand configuration.";

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
          <span>{dragHint}</span>
        </div>
      )}

      {!readOnly && (
        <div className="mb-3">
          <p className="text-sm font-medium text-gray-700">
            Time (30-min slots, 00:00 - 23:30)
          </p>
        </div>
      )}

      {/* Existing demands: each demand occupies its own 48-slot row */}
      {sortedDemands.map((demand, index) => {
        const enabledSlots = buildEnabledSlotsFromDemand(demand);
        const tooltipContent = buildDemandTooltip(demand);

        return (
          <div key={demand.id} className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <div className="text-sm font-semibold text-gray-900">
                {`Demand #${index + 1}: ${demand.name}`}
              </div>
              <div className="text-xs text-gray-500">
                {normalizeTime(demand.start_time)} - {normalizeTime(demand.end_time)}{" "}
                | Months {demand.start_month} - {demand.end_month} | Lookback{" "}
                {demand.lookback_days} days
              </div>
            </div>
            <div className="time-slot-grid">
              {Array.from({ length: SLOT_COUNT }, (_, slotIndex) => {
                const isEnabled = enabledSlots[slotIndex];
                const slotElement = (
                  <div
                    key={slotIndex}
                    className="time-slot"
                    style={{
                      backgroundColor: isEnabled ? "#bbf7d0" : "#f0f0f0",
                      borderColor: isEnabled ? "#22c55e" : "transparent",
                      cursor: isEnabled && !readOnly ? "pointer" : "default",
                    }}
                    onClick={() => {
                      if (isEnabled && !readOnly) {
                        onEditDemand(demand);
                      }
                    }}
                  />
                );

                if (!isEnabled) {
                  return slotElement;
                }

                return (
                  <Tooltip key={slotIndex} content={tooltipContent} position="top">
                    {slotElement}
                  </Tooltip>
                );
              })}
            </div>
            {renderTimeAxis()}
          </div>
        );
      })}

      {/* New demand placeholder row (hidden in readOnly mode) */}
      {!readOnly && (
        <div className="mt-2">
          <div className="flex items-center justify-between mb-1">
            <div className="text-sm font-semibold text-gray-900">
              New demand placeholder row
            </div>
            <div className="text-xs text-gray-500">
              Drag across this row to configure a new demand.
            </div>
          </div>
          <div className="time-slot-grid">
            {Array.from({ length: SLOT_COUNT }, (_, slotIndex) => {
              const isInDragRange =
                dragRange &&
                slotIndex >= Math.min(dragRange.start, dragRange.end) &&
                slotIndex <= Math.max(dragRange.start, dragRange.end);

              return (
                <div
                  key={slotIndex}
                  className="time-slot"
                  style={{
                    backgroundColor: isInDragRange ? "#bbf7d0" : "#ffffff",
                    borderColor: isInDragRange ? "#22c55e" : "transparent",
                    cursor: "crosshair",
                  }}
                  onMouseDown={() => handlePlaceholderMouseDown(slotIndex)}
                  onMouseEnter={() => handlePlaceholderMouseEnter(slotIndex)}
                  onMouseUp={() => handlePlaceholderMouseUp(slotIndex)}
                />
              );
            })}
          </div>
          {renderTimeAxis()}
        </div>
      )}
    </div>
  );
};
