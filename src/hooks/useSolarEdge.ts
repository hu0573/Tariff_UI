import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { solaredgeApi } from '@/api/solaredge';
import type { 
  SolarEdgeConfigUpdate, 
  TestConnectionRequest 
} from '@/api/solaredge';
import { toastManager } from '@/components/common/Toast';

/**
 * Hook to fetch SolarEdge configuration
 */
export function useSolarEdgeConfig() {
  return useQuery({
    queryKey: ['solaredge', 'config'],
    queryFn: async () => {
      const response = await solaredgeApi.getConfig();
      return response.data;
    },
  });
}

/**
 * Hook to update SolarEdge configuration
 */
export function useUpdateSolarEdgeConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: SolarEdgeConfigUpdate) => {
      const response = await solaredgeApi.updateConfig(data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solaredge', 'config'] });
      toastManager.success('Configuration saved successfully');
    },
    onError: (error: any) => {
      toastManager.error(
        `Failed to save configuration: ${error?.response?.data?.detail || error.message}`
      );
    },
  });
}

/**
 * Hook to test SolarEdge API connection
 */
export function useTestSolarEdgeConnection() {
  return useMutation({
    mutationFn: async (data?: TestConnectionRequest) => {
      const response = await solaredgeApi.testConnection(data);
      return response.data;
    },
    onSuccess: (data) => {
      if (data.success) {
        toastManager.success(data.message);
      } else {
        toastManager.error(data.message);
      }
    },
    onError: (error: any) => {
      toastManager.error(
        `Connection test failed: ${error?.response?.data?.detail || error.message}`
      );
    },
  });
}
