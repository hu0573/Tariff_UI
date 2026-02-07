// React Query hooks for Channel Mapping
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { channelMappingApi } from "@/api/channelMapping";
import type {
  ChannelMappingDetail,
  ChannelMappingUpdateRequest,
  ChannelStatusResponse,
  MonitoredNMIItem,
  PowerMetric,
} from "@/api/channelMapping";

// Get monitored NMIs
export const useMonitoredNMIs = () => {
  return useQuery<MonitoredNMIItem[]>({
    queryKey: ["channel-mapping", "monitored-nmis"],
    queryFn: () =>
      channelMappingApi.getMonitoredNMIs().then((res) => res.data.data),
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
    refetchOnWindowFocus: false,
  });
};

// Get all channel mappings
export const useAllChannelMappings = () => {
  return useQuery({
    queryKey: ["channel-mapping", "all"],
    queryFn: () => channelMappingApi.getAllMappings().then((res) => res.data),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });
};

// Get channel mapping by NMI
export const useChannelMapping = (
  nmi: string | undefined,
  enabled: boolean = true
) => {
  return useQuery<ChannelMappingDetail>({
    queryKey: ["channel-mapping", "detail", nmi],
    queryFn: async () => {
      if (!nmi) {
        throw new Error("NMI is required");
      }
      const res = await channelMappingApi.getMappingByNMI(nmi);
      return res.data.data || res.data || null;
    },
    enabled: enabled && !!nmi,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });
};

// Get channel status for NMI
export const useChannelStatus = (
  nmi: string | undefined,
  enabled: boolean = true
) => {
  return useQuery<ChannelStatusResponse>({
    queryKey: ["channel-mapping", "status", nmi],
    queryFn: async () => {
      if (!nmi) {
        throw new Error("NMI is required");
      }
      const res = await channelMappingApi.getChannelStatus(nmi);
      return res.data.data || res.data || null;
    },
    enabled: enabled && !!nmi,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    refetchOnWindowFocus: false,
  });
};

// Get power metrics options
export const usePowerMetricsOptions = () => {
  return useQuery<PowerMetric[]>({
    queryKey: ["channel-mapping", "power-metrics-options"],
    queryFn: () =>
      channelMappingApi.getPowerMetricsOptions().then((res) => res.data.data),
    staleTime: 10 * 60 * 1000, // Consider data fresh for 10 minutes (rarely changes)
    refetchOnWindowFocus: false,
  });
};


// Create or update channel mapping
export const useCreateOrUpdateChannelMapping = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      nmi,
      data,
    }: {
      nmi: string;
      data: ChannelMappingUpdateRequest;
    }) => channelMappingApi.createOrUpdateMapping(nmi, data),
    onSuccess: async (_response, variables) => {
      // Invalidate related queries
      await queryClient.invalidateQueries({
        queryKey: ["channel-mapping", "detail", variables.nmi],
      });
      await queryClient.invalidateQueries({
        queryKey: ["channel-mapping", "all"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["channel-mapping", "monitored-nmis"],
      });

      // Show success message
      const { toastManager } = await import("@/components/common/Toast");
      toastManager.success(
        `✓ Channel mapping for NMI ${variables.nmi} saved successfully!`
      );
    },
    onError: async (error: any) => {
      console.error("Failed to save channel mapping:", error);

      const { toastManager } = await import("@/components/common/Toast");
      const errorMsg =
        error?.response?.data?.detail?.message ||
        error?.response?.data?.message ||
        error?.message ||
        "Failed to save channel mapping";
      toastManager.error(`✗ ${errorMsg}`);
    },
  });
};

// Delete channel mapping
export const useDeleteChannelMapping = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (nmi: string) => channelMappingApi.deleteMapping(nmi),
    onSuccess: async (_response, nmi) => {
      // Invalidate related queries
      await queryClient.invalidateQueries({
        queryKey: ["channel-mapping", "detail", nmi],
      });
      await queryClient.invalidateQueries({
        queryKey: ["channel-mapping", "all"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["channel-mapping", "monitored-nmis"],
      });

      // Show success message
      const { toastManager } = await import("@/components/common/Toast");
      toastManager.success(
        `✓ Channel mapping for NMI ${nmi} deleted successfully!`
      );
    },
    onError: async (error: any) => {
      console.error("Failed to delete channel mapping:", error);

      const { toastManager } = await import("@/components/common/Toast");
      const errorMsg =
        error?.response?.data?.detail?.message ||
        error?.response?.data?.message ||
        error?.message ||
        "Failed to delete channel mapping";
      toastManager.error(`✗ ${errorMsg}`);
    },
  });
};

// Bulk initialize channel mappings
export const useBulkInitializeChannels = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => channelMappingApi.bulkInitialize(),
    onSuccess: async (response) => {
      // Invalidate related queries
      await queryClient.invalidateQueries({
        queryKey: ["channel-mapping", "all"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["channel-mapping", "monitored-nmis"],
      });

      const { initialized_count, failed_count } = response.data.data;
      const { toastManager } = await import("@/components/common/Toast");

      if (failed_count === 0) {
        toastManager.success(
          `✓ Successfully initialized ${initialized_count} NMIs!`
        );
      } else {
        toastManager.warning(
          `⚠ Initialized ${initialized_count} NMIs, but ${failed_count} failed.`
        );
      }
    },
    onError: async (error: any) => {
      console.error("Failed to bulk initialize channel mappings:", error);

      const { toastManager } = await import("@/components/common/Toast");
      const errorMsg =
        error?.response?.data?.detail?.message ||
        error?.response?.data?.message ||
        error?.message ||
        "Failed to bulk initialize channel mappings";
      toastManager.error(`✗ ${errorMsg}`);
    },
  });
};
