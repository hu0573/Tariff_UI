// React Query hooks for public holiday
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { publicHolidayApi } from "@/api/publicHoliday";

// Configuration management hooks
export const usePublicHolidayRefreshConfig = () => {
  return useQuery({
    queryKey: ["public-holiday-refresh-config"],
    queryFn: () => publicHolidayApi.getRefreshConfig().then((res) => res.data),
  });
};

export const useUpdatePublicHolidayRefreshConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (config: { frequency: string }) =>
      publicHolidayApi.updateRefreshConfig(config),
    onSuccess: async () => {
      // Refresh config after update
      await queryClient.invalidateQueries({
        queryKey: ["public-holiday-refresh-config"],
      });

      // Show success message
      const { toastManager } = await import("@/components/common/Toast");
      toastManager.success(
        "✓ Public holiday refresh configuration saved successfully!"
      );
    },
    onError: async (error: any) => {
      console.error("Failed to update public holiday refresh config:", error);

      const { toastManager } = await import("@/components/common/Toast");
      const errorMsg =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        error?.message ||
        "Failed to save configuration";
      toastManager.error(`✗ ${errorMsg}`);
    },
  });
};

// Download history hooks
export const usePublicHolidayDownloadHistory = (limit: number = 30) => {
  return useQuery({
    queryKey: ["public-holiday-download-history", limit],
    queryFn: () =>
      publicHolidayApi.getDownloadHistory(limit).then((res) => res.data),
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
    refetchOnWindowFocus: false,
  });
};

// Calendar data hooks
export const usePublicHolidayCalendarData = ({
  year,
  month,
  is_relative_time,
  relative_time,
  state,
  enabled = true
}: {
  year?: number;
  month?: number;
  is_relative_time?: boolean;
  relative_time?: string;
  state: string;
  enabled?: boolean;
}) => {
  return useQuery({
    queryKey: ["public-holiday-calendar", year, month, is_relative_time, relative_time, state],
    queryFn: () =>
      publicHolidayApi
        .getCalendarData({ year, month, is_relative_time, relative_time, state })
        .then((res) => res.data),
    enabled: enabled && !!state && (is_relative_time ? !!relative_time : (!!year && !!month)),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

// Holiday query hooks
export const usePublicHolidayData = (
  params?: {
    state?: string;
    year?: number;
    is_relative_time?: boolean;
    relative_time?: string;
    start_utc_timestamp?: number;
    end_utc_timestamp?: number;
  },
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ["public-holiday-data", params],
    queryFn: () => publicHolidayApi.getHolidays(params).then((res) => res.data),
    enabled: enabled && !!params?.state,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    refetchOnWindowFocus: false,
  });
};

export const usePublicHolidaysByRange = (
  state: string,
  start_utc_timestamp: number,
  end_utc_timestamp: number,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ["public-holidays-by-range", state, start_utc_timestamp, end_utc_timestamp],
    queryFn: () =>
      publicHolidayApi
        .getHolidays({ state, start_utc_timestamp, end_utc_timestamp })
        .then((res) => res.data),
    enabled: enabled && !!state && !!start_utc_timestamp && !!end_utc_timestamp,
    staleTime: 5 * 60 * 1000,
  });
};

// Available years hook
export const usePublicHolidayAvailableYears = () => {
  return useQuery({
    queryKey: ["public-holiday-available-years"],
    queryFn: () => publicHolidayApi.getAvailableYears().then((res) => res.data),
    staleTime: 60 * 60 * 1000, // Consider data fresh for 1 hour
    refetchOnWindowFocus: false,
  });
};
