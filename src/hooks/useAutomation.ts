// React Query hooks for automation
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { automationApi } from '@/api/automation';

export const useAutomationStatus = () => {
  return useQuery({
    queryKey: ['automation-status'],
    queryFn: () => automationApi.getStatus().then(res => res.data),
    refetchInterval: 5000, // Refresh every 5 seconds for real-time updates
    retry: 3, // Retry failed requests up to 3 times
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    staleTime: 0, // Always consider stale for real-time updates
  });
};

export const useActiveWorkers = () => {
  return useQuery({
    queryKey: ['active-workers'],
    queryFn: async () => {
      const response = await automationApi.getWorkers();
      return response.data;
    },
    refetchInterval: 10000, // Poll every 10 seconds
  });
};

export const useStartAutomation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: automationApi.start,
    onSuccess: async (response) => {
      // Immediately refetch status to get updated state
      await queryClient.refetchQueries({ queryKey: ['automation-status'] });
      
      // Show message based on actual result
      const { toastManager } = await import('@/components/common/Toast');
      if (response.data?.success) {
        toastManager.success('✓ Automation started successfully!');
      } else {
        // Even if API returns 200, check the success field
        const errorMsg = response.data?.message || 'Failed to start automation';
        toastManager.error(`✗ ${errorMsg}`);
      }
    },
    onError: async (error: any) => {
      console.error('Failed to start automation:', error);
      const { toastManager } = await import('@/components/common/Toast');
      const errorMsg = error?.response?.data?.detail || error?.response?.data?.message || error?.message || 'Failed to start automation';
      toastManager.error(`✗ ${errorMsg}`);
    },
  });
};

export const useStopAutomation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: automationApi.stop,
    onSuccess: async (response) => {
      // Immediately refetch status to get updated state
      await queryClient.refetchQueries({ queryKey: ['automation-status'] });
      
      // Show message based on actual result
      const { toastManager } = await import('@/components/common/Toast');
      if (response.data?.success) {
        toastManager.success('✓ Automation stopped successfully!');
      } else {
        const errorMsg = response.data?.message || 'Failed to stop automation';
        toastManager.error(`✗ ${errorMsg}`);
      }
    },
    onError: async (error: any) => {
      console.error('Failed to stop automation:', error);
      const { toastManager } = await import('@/components/common/Toast');
      const errorMsg = error?.response?.data?.detail || error?.response?.data?.message || error?.message || 'Failed to stop automation';
      toastManager.error(`✗ ${errorMsg}`);
    },
  });
};
