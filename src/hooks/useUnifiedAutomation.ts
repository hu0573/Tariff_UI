// React Query hooks for unified automation system
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { automationApi } from '@/api/automation';

/**
 * Hook to fetch unified automation status
 * Returns aggregated system status and automation progress
 */
export const useUnifiedAutomationStatus = () => {
  return useQuery({
    queryKey: ['unified-automation-status'],
    queryFn: () => automationApi.getUnifiedStatus().then(res => res.data),
    refetchInterval: 5000, // Refresh every 5 seconds for real-time updates
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 0, // Always consider stale for real-time updates
  });
};

/**
 * Hook to fetch active nodes
 * @param nodeType - Optional filter by node type ('automation' or 'report')
 */
export const useActiveNodes = (nodeType?: string, includeInactive: boolean = false) => {
  return useQuery({
    queryKey: ['active-nodes', nodeType, includeInactive],
    queryFn: () =>
      automationApi
        .getActiveNodes(
          nodeType
            ? { node_type: nodeType, include_inactive: includeInactive }
            : { include_inactive: includeInactive }
        )
        .then(res => res.data),
    refetchInterval: 10000, // Poll every 10 seconds
    retry: 3,
  });
};

/**
 * Hook to fetch task history
 * @param params - Query parameters for filtering and pagination
 */
export const useTaskHistory = (params?: {
  node_type?: string;
  status?: string;
  limit?: number;
  offset?: number;
}) => {
  return useQuery({
    queryKey: ['task-history', params],
    queryFn: () => automationApi.getTasks(params).then(res => res.data),
    refetchInterval: 10000, // Poll every 10 seconds
    retry: 3,
  });
};

/**
 * Hook to trigger manual automation run
 * Creates a new task in node_tasks table
 */
export const useManualRun = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: automationApi.manualRun,
    onSuccess: async (response) => {
      // Immediately refetch status to get updated state
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['unified-automation-status'] }),
        queryClient.refetchQueries({ queryKey: ['task-history'] }),
      ]);
      
      // Show success message
      const { toastManager } = await import('@/components/common/Toast');
      if (response.data?.success) {
        const taskId = response.data?.task_id;
        toastManager.success(
          `✓ Manual automation task created successfully! (Task ID: ${taskId})`
        );
      } else {
        const errorMsg = response.data?.message || 'Failed to create automation task';
        toastManager.error(`✗ ${errorMsg}`);
      }
    },
    onError: async (error: any) => {
      console.error('Failed to trigger manual run:', error);
      const { toastManager } = await import('@/components/common/Toast');
      const errorMsg = 
        error?.response?.data?.detail || 
        error?.response?.data?.message || 
        error?.message || 
        'Failed to create automation task';
      toastManager.error(`✗ ${errorMsg}`);
    },
  });
};
