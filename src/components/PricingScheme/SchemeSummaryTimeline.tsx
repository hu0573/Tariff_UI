import React, { useMemo } from "react";
import type { PricingSchemeDetail, Demand } from "@/api/pricingSchemes";
import type { Period } from "@/components/PricingScheme/TimeSlotSelector/types";
import { Tooltip } from "@/components/common/Tooltip";
import { TIME_SLOT_CONFIG } from "@/components/PricingScheme/TimeSlotSelector/types";
import { timeToSlotIndex } from "@/components/PricingScheme/TimeSlotSelector/DragHandler";
import "@/components/PricingScheme/TimeSlotSelector/styles.css";

interface SchemeSummaryTimelineProps {
  scheme: PricingSchemeDetail;
  periodsWithColors: Period[];
  onPeriodClick?: (periodId: number) => void;
  onDemandClick?: (demandId: number) => void;
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

// Build enabled slots from Period
const buildPeriodSlots = (period: Period): boolean[] => {
  const base = Array.from({ length: SLOT_COUNT }, () => false);
  const startIndex = timeToSlotIndex(normalizeTime(period.startTime));
  const endIndexExclusive = timeToSlotIndex(normalizeTime(period.endTime));
  const startSlot = Math.max(0, Math.min(startIndex, SLOT_COUNT - 1));
  const endSlotExclusive = Math.max(
    startSlot + 1,
    Math.min(endIndexExclusive, SLOT_COUNT)
  );

  for (let i = startSlot; i < endSlotExclusive; i += 1) {
    base[i] = true;
  }

  return base;
};

// Build enabled slots from Demand
const buildDemandSlots = (demand: Demand): boolean[] => {
  const base = Array.from({ length: SLOT_COUNT }, () => false);

  // Use start_time and end_time to calculate enabled slots
  const startIndex = timeToSlotIndex(normalizeTime(demand.start_time));
  const endIndexExclusive = timeToSlotIndex(normalizeTime(demand.end_time));
  const startSlot = Math.max(0, Math.min(startIndex, SLOT_COUNT - 1));
  const endSlotExclusive = Math.max(
    startSlot + 1,
    Math.min(endIndexExclusive, SLOT_COUNT)
  );

  for (let i = startSlot; i < endSlotExclusive; i += 1) {
    base[i] = true;
  }

  return base;
};

// Build period color map for a group (handles overlaps by taking last period)
const buildPeriodColorMap = (
  periods: Period[],
  group: 0 | 1 | 2
): Map<number, { color: string; period: Period }> => {
  const filteredPeriods = periods.filter((p) => p.group === group);
  const colorMap = new Map<number, { color: string; period: Period }>();

  filteredPeriods.forEach((period) => {
    const slots = buildPeriodSlots(period);
    slots.forEach((enabled, slotIndex) => {
      if (enabled) {
        // Later period overwrites earlier one for same slot
        colorMap.set(slotIndex, { color: period.color, period });
      }
    });
  });

  return colorMap;
};

const buildPeriodTooltip = (period: Period): string => {
  const lines = [
    period.name || "Period",
    `${normalizeTime(period.startTime)} - ${normalizeTime(period.endTime)}`,
    `Price: ${period.price.toFixed(4)} AUD/kWh`,
  ];
  if (period.description) {
    lines.push(period.description);
  }
  return lines.join("\n");
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
  if (demand.description) {
    lines.push(demand.description);
  }
  return lines.join("\n");
};


const buildDynamicPricingTooltip = (): string => {
  return "Dynamic Pricing: Price varies based on market conditions";
};

const renderTimeAxis = () => {
  const totalHours = 25; // 00 to 24 (25 hours)

  return (
    <div
      className="time-axis"
      style={{
        display: "flex",
        justifyContent: "space-between", // Evenly distribute 25 elements
        alignItems: "flex-start",
        padding: "0", // No padding to eliminate gaps on left and right
        flex: 1,
        position: "relative",
      }}
    >
      {/* All hours: 00, 01, 02, ..., 23, 24 */}
      {Array.from({ length: totalHours }, (_, i) => {
        const hour = i; // Hours: 0, 1, 2, ..., 24

        // First hour (00) - left aligned
        if (hour === 0) {
          return (
            <div
              key={i}
              className="time-axis-label"
              style={{
                textAlign: "left",
                fontSize: "0.6875rem",
                color: "#666",
                whiteSpace: "nowrap",
                flex: "0 0 auto",
              }}
            >
              {hour.toString().padStart(2, "0")}
            </div>
          );
        }

        // Last hour (24) - right aligned
        if (hour === 24) {
          return (
            <div
              key={i}
              className="time-axis-label"
              style={{
                textAlign: "right",
                fontSize: "0.6875rem",
                color: "#666",
                whiteSpace: "nowrap",
                flex: "0 0 auto",
              }}
            >
              {hour.toString().padStart(2, "0")}
            </div>
          );
        }

        // Other hours - center aligned
        return (
          <div
            key={i}
            className="time-axis-label"
            style={{
              textAlign: "center",
              fontSize: "0.6875rem",
              color: "#666",
              whiteSpace: "nowrap",
              flex: "0 0 auto",
            }}
          >
            {hour.toString().padStart(2, "0")}
          </div>
        );
      })}
    </div>
  );
};

export const SchemeSummaryTimeline: React.FC<SchemeSummaryTimelineProps> = ({
  scheme,
  periodsWithColors,
  onPeriodClick,
  onDemandClick,
}) => {
  // Build period color maps for each group
  const weekdayColorMap = useMemo(
    () => buildPeriodColorMap(periodsWithColors, 1),
    [periodsWithColors]
  );
  const weekendColorMap = useMemo(
    () => buildPeriodColorMap(periodsWithColors, 2),
    [periodsWithColors]
  );
  const generalColorMap = useMemo(
    () => buildPeriodColorMap(periodsWithColors, 0),
    [periodsWithColors]
  );

  // Build demand slots - sort by created_at (if available) to match backend order, otherwise by ID
  const demandSlotsList = useMemo(() => {
    // Sort demands by created_at (ascending) to match backend order
    const sortedDemands = [...scheme.demands].sort((a, b) => {
      if (a.created_at && b.created_at) {
        return (
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      }
      // Fallback to ID if created_at is not available
      return a.id - b.id;
    });
    return sortedDemands.map((demand) => ({
      demand,
      slots: buildDemandSlots(demand),
    }));
  }, [scheme.demands]);

  const renderTimelineRow = (
    label: string,
    slots: boolean[],
    colorMap?: Map<number, { color: string; period: Period }>,
    demand?: Demand,
    rowType?: "dynamic"
  ) => {
    return (
      <div className="mb-0.5">
        <div className="flex items-center gap-2 mb-0.5">
          <div className="text-xs font-semibold text-gray-900 min-w-[140px]">
            {label}
          </div>
          <div className="time-slot-grid" style={{ flex: 1, padding: "4px 0" }}>
            {Array.from({ length: SLOT_COUNT }, (_, slotIndex) => {
              const isEnabled = slots[slotIndex];
              const periodInfo = colorMap?.get(slotIndex);

              // Determine colors based on row type
              let backgroundColor = "#ffffff";
              let borderColor = "transparent";

              if (rowType === "dynamic") {
                backgroundColor = "#dbeafe"; // Light blue
                borderColor = "#60a5fa"; // Blue border
              } else if (periodInfo) {
                backgroundColor = periodInfo.color;
                borderColor = periodInfo.color;
              } else if (isEnabled) {
                if (demand) {
                  backgroundColor = "#bbf7d0"; // Demand green
                  borderColor = "#22c55e"; // Demand green border
                } else {
                  backgroundColor = "#f0f0f0"; // Default gray
                  borderColor = "transparent";
                }
              }

              // Determine if clickable (only if callbacks are provided)
              const isClickable =
                isEnabled &&
                ((periodInfo && onPeriodClick) || (demand && onDemandClick));

              const slotElement = (
                <div
                  key={slotIndex}
                  className="time-slot"
                  style={{
                    backgroundColor,
                    borderColor,
                    cursor: isClickable ? "pointer" : "default",
                    height: "20px", // Half height: 20px instead of 40px
                  }}
                  onClick={() => {
                    if (isClickable) {
                      if (periodInfo && onPeriodClick) {
                        onPeriodClick(periodInfo.period.id);
                      } else if (demand && onDemandClick) {
                        onDemandClick(demand.id);
                      }
                    }
                  }}
                />
              );

              // Add tooltip if enabled
              if (isEnabled) {
                if (rowType === "dynamic") {
                  return (
                    <Tooltip
                      key={slotIndex}
                      content={buildDynamicPricingTooltip()}
                      position="top"
                    >
                      {slotElement}
                    </Tooltip>
                  );
                } else if (periodInfo) {
                  return (
                    <Tooltip
                      key={slotIndex}
                      content={buildPeriodTooltip(periodInfo.period)}
                      position="top"
                    >
                      {slotElement}
                    </Tooltip>
                  );
                } else if (demand) {
                  return (
                    <Tooltip
                      key={slotIndex}
                      content={buildDemandTooltip(demand)}
                      position="top"
                    >
                      {slotElement}
                    </Tooltip>
                  );
                }
              }

              return slotElement;
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* Top time axis */}
      <div className="flex items-center gap-2 mb-0.5">
        <div className="min-w-[140px]"></div>
        {renderTimeAxis()}
      </div>


      {/* Spot Price row */}
      {scheme.enable_spot_market_buy &&
        renderTimelineRow(
          "Dynamic Pricing",
          Array.from({ length: SLOT_COUNT }, () => true),
          undefined,
          undefined,
          "dynamic"
        )}

      {/* Period rows */}
      {scheme.enable_weekday_pricing ? (
        <>
          {/* Weekday row */}
          {renderTimelineRow(
            "Weekday",
            Array.from({ length: SLOT_COUNT }, (_, slotIndex) =>
              weekdayColorMap.has(slotIndex)
            ),
            weekdayColorMap
          )}
          {/* Weekend row */}
          {renderTimelineRow(
            "Weekend",
            Array.from({ length: SLOT_COUNT }, (_, slotIndex) =>
              weekendColorMap.has(slotIndex)
            ),
            weekendColorMap
          )}
        </>
      ) : (
        /* General row */
        renderTimelineRow(
          "General",
          Array.from({ length: SLOT_COUNT }, (_, slotIndex) =>
            generalColorMap.has(slotIndex)
          ),
          generalColorMap
        )
      )}

      {/* Demand rows */}
      {demandSlotsList.map(({ demand, slots }, index) => (
        <div key={demand.id}>
          {renderTimelineRow(`Demand #${index + 1}`, slots, undefined, demand)}
        </div>
      ))}

      {/* Bottom time axis */}
      <div className="flex items-center gap-2 mt-0.5">
        <div className="min-w-[140px]"></div>
        {renderTimeAxis()}
      </div>
    </div>
  );
};
