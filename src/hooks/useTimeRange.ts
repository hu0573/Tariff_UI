import { useQuery } from "@tanstack/react-query";
import {
  timeRangeApi,
  type TimeRangeApiResponse,
} from "@/api/timeRange";

export type TimeRangeGranularity = "day" | "month" | "range";

export interface UseTimeRangeParams {
  state?: string;
  timezone?: string;
  granularity: TimeRangeGranularity;
  date?: string;
  year?: number;
  month?: number;
  start_date?: string;
  end_date?: string;
  enabled?: boolean;
}

export function useTimeRange({
  state,
  timezone,
  granularity,
  date,
  year,
  month,
  start_date,
  end_date,
  enabled = true,
}: UseTimeRangeParams) {
  return useQuery({
    queryKey: [
      "time-range",
      granularity,
      state,
      timezone,
      date,
      year,
      month,
      start_date,
      end_date,
    ],
    enabled:
      enabled &&
      (!!state || !!timezone) &&
      ((granularity === "day" && !!date) ||
        (granularity === "month" && !!year && !!month) ||
        (granularity === "range" && !!start_date && !!end_date)),
    queryFn: (): Promise<TimeRangeApiResponse> => {
      if (granularity === "day") {
        if (!date) {
          throw new Error("Date is required for day time range.");
        }
        return timeRangeApi
          .getDayRange({ state, timezone, date })
          .then((res) => res.data);
      }
      if (granularity === "month") {
        if (typeof year !== "number" || typeof month !== "number") {
          throw new Error("Year and month are required for month time range.");
        }
        return timeRangeApi
          .getMonthRange({ state, timezone, year, month })
          .then((res) => res.data);
      }
      if (!start_date || !end_date) {
        throw new Error("start_date and end_date are required for range.");
      }
      return timeRangeApi
        .getRangeForDates({ state, timezone, start_date, end_date })
        .then((res) => res.data);
    },
  });
}
