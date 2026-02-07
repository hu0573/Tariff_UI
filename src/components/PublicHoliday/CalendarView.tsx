// Public Holiday Calendar View Component
import { useMemo, useState } from "react";
import {
  format,
  getDay,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isWeekend,
} from "date-fns";

interface Holiday {
  holiday_date: string;
  name: string;
  state: string;
  start_utc_timestamp: number;
  end_utc_timestamp: number;
}

interface CalendarViewProps {
  year: number;
  month: number; // 1-12
  holidays: Holiday[];
}

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  date: Date;
  holiday?: Holiday;
}

interface CalendarStatistics {
  weekdays: number;
  nonWeekdays: number;
  weekends: number;
  holidays: number;
  weekendHolidays: number;
}

export default function CalendarView({
  year,
  month,
  holidays,
}: CalendarViewProps) {
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    date: new Date(),
  });
  // Generate calendar grid for the month
  const calendarDays = useMemo(() => {
    const start = startOfMonth(new Date(year, month - 1, 1));
    const end = endOfMonth(new Date(year, month - 1, 1));
    return eachDayOfInterval({ start, end });
  }, [year, month]);

  // Create holiday lookup map for quick access
  const holidayMap = useMemo(() => {
    const map = new Map<string, Holiday>();
    holidays.forEach((holiday) => {
      map.set(holiday.holiday_date, holiday);
    });
    return map;
  }, [holidays]);

  // Calculate statistics
  const statistics = useMemo((): CalendarStatistics => {
    let weekdays = 0;
    let weekends = 0;
    let holidayCount = 0;
    let weekendHolidayCount = 0;

    calendarDays.forEach((date) => {
      const isWeekendDay = isWeekend(date);
      const dateStr = format(date, "yyyy-MM-dd");
      const holiday = holidayMap.get(dateStr);

      if (isWeekendDay && holiday) {
        // Both weekend and holiday
        weekends++;
        holidayCount++;
        weekendHolidayCount++;
      } else if (isWeekendDay) {
        // Just weekend
        weekends++;
      } else if (holiday) {
        // Just holiday
        holidayCount++;
      } else {
        // Regular weekday
        weekdays++;
      }
    });

    // nonWeekdays = weekends + holidays - weekendHolidays (to avoid double counting)
    const nonWeekdays = weekends + holidayCount - weekendHolidayCount;

    return {
      weekdays,
      nonWeekdays,
      weekends,
      holidays: holidayCount,
      weekendHolidays: weekendHolidayCount,
    };
  }, [calendarDays, holidayMap]);

  // Get day of week for first day (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  const firstDayOfWeek = getDay(calendarDays[0]);

  // Generate week headers
  const weekHeaders = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  // Handle internal mouse events for tooltip
  const handleMouseEnter = (
    event: React.MouseEvent<HTMLDivElement>,
    day: Date,
    holiday?: Holiday
  ) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltip({
      visible: true,
      x: rect.left + rect.width / 2,
      y: rect.top - 10, // Show above the cell
      date: day,
      holiday,
    });
  };

  const handleMouseLeave = () => {
    setTooltip((prev) => ({ ...prev, visible: false }));
  };

  // Generate calendar grid (6 weeks max)
  const generateCalendarGrid = () => {
    const rows: React.JSX.Element[] = [];
    let currentWeek: (Date | null)[] = [];

    // Fill initial empty cells for the first week
    for (let i = 0; i < firstDayOfWeek; i++) {
      currentWeek.push(null);
    }

    calendarDays.forEach((date, index) => {
      currentWeek.push(date);

      // If we have 7 days or it's the last day, create a row
      if (currentWeek.length === 7 || index === calendarDays.length - 1) {
        // Fill remaining cells with null if needed
        while (currentWeek.length < 7) {
          currentWeek.push(null);
        }

        rows.push(
          <div key={rows.length} className="grid grid-cols-7 gap-1">
            {currentWeek.map((day, dayIndex) => {
              if (!day) {
                return <div key={dayIndex} className="h-12" />;
              }

              const dateStr = format(day, "yyyy-MM-dd");
              const holiday = holidayMap.get(dateStr);
              const isWeekendDay = isWeekend(day);

              // Determine cell styling
              let cellClassName =
                "h-12 flex items-center justify-center text-sm font-medium rounded cursor-pointer transition-colors relative ";

              if (holiday && isWeekendDay) {
                // Both weekend and holiday - dark red/orange
                cellClassName += "bg-red-200 text-red-800 hover:bg-red-300";
              } else if (holiday) {
                // Just holiday - red/orange
                cellClassName +=
                  "bg-orange-200 text-orange-800 hover:bg-orange-300";
              } else if (isWeekendDay) {
                // Just weekend - gray
                cellClassName += "bg-gray-200 text-gray-700 hover:bg-gray-300";
              } else {
                // Regular weekday - white
                cellClassName +=
                  "bg-white text-gray-900 hover:bg-gray-100 border border-gray-200";
              }

              return (
                <div
                  key={dayIndex}
                  className={cellClassName}
                  onMouseEnter={(e) => handleMouseEnter(e, day, holiday)}
                  onMouseLeave={handleMouseLeave}
                >
                  {format(day, "d")}
                  {holiday && (
                    <div
                      className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"
                      title={holiday.name}
                    />
                  )}
                </div>
              );
            })}
          </div>
        );

        currentWeek = [];
      }
    });

    return rows;
  };

  const monthName = format(new Date(year, month - 1, 1), "MMMM yyyy");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar Section - Left Side */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {/* Calendar Header */}
          <div className="mb-4">
            <h3 className="text-xl font-semibold text-gray-900 text-center">
              {monthName}
            </h3>
          </div>

          {/* Week Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekHeaders.map((header, index) => (
              <div
                key={index}
                className="h-8 flex items-center justify-center text-xs font-semibold text-gray-600 uppercase tracking-wide"
              >
                {header}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="space-y-1">{generateCalendarGrid()}</div>
        </div>
      </div>

      {/* Legend and Statistics Section - Right Side */}
      <div className="space-y-6">
        {/* Legend */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Legend</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-white border border-gray-200 rounded"></div>
              <span className="text-gray-700">Weekday</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-200 rounded"></div>
              <span className="text-gray-700">Weekend</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-200 rounded"></div>
              <span className="text-gray-700">Public Holiday</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-200 rounded"></div>
              <span className="text-gray-700">Weekend + Holiday</span>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">
            Statistics
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-700">Weekdays:</span>
              <span className="font-medium text-gray-900">
                {statistics.weekdays}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Non-weekdays:</span>
              <span className="font-medium text-gray-900">
                {statistics.nonWeekdays}
              </span>
            </div>
            <div className="text-xs text-gray-500 ml-4 space-y-1">
              <div className="flex justify-between">
                <span>Weekends:</span>
                <span>{statistics.weekends}</span>
              </div>
              <div className="flex justify-between">
                <span>Holidays:</span>
                <span>{statistics.holidays}</span>
              </div>
            </div>
            <div className="text-xs text-gray-500 italic mt-1">
              Note: Weekend holidays are not double-counted
            </div>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip.visible && (
        <div
          className="fixed z-50 pointer-events-none bg-gray-900 text-white text-sm px-2 py-1 rounded shadow-lg max-w-xs"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: "translate(-50%, -100%)",
          }}
        >
          <div className="font-medium">
            {format(tooltip.date, "MMM dd, yyyy")}
          </div>
          {tooltip.holiday && (
            <div className="text-yellow-200 mt-1">{tooltip.holiday.name}</div>
          )}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
}
