// React Query hooks for execution
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { executionApi } from '@/api/execution';

// Type definitions for execution status and progress
export type TaskStage = {
  name: string;
  status: 'waiting' | 'running' | 'completed' | 'failed' | 'skipped';
  priority: number;
  start_time: string | null;
  end_time: string | null;
  execution_time: number | null;
  message: string | null;
};

export type ExecutionProgress = {
  current_task: string | null;
  completed: number;
  total: number;
  success: number;
  failed: number;
  percentage: number;
  task_stages?: TaskStage[];
};

export type ExecutionStatus = {
  is_running: boolean;
  started_at: number | null;
  progress: ExecutionProgress;
  estimated_remaining_seconds: number | null;
};

export const useExecutionHistory = (params?: {
  page?: number;
  limit?: number;
  start_utc_timestamp?: number;
  end_utc_timestamp?: number;
}) => {
  return useQuery({
    queryKey: ['execution-history', params],
    queryFn: () => executionApi.getHistory(params).then(res => res.data),
    retry: 2,
    staleTime: 30000, // Consider data stale after 30 seconds
  });
};

export const useExecutionStatistics = (days: number = 7) => {
  return useQuery({
    queryKey: ['execution-statistics', days],
    queryFn: () => executionApi.getStatistics(days).then(res => res.data),
    retry: 2,
    staleTime: 60000, // Statistics change less frequently
  });
};

export const useExecutionStatus = () => {
  return useQuery<ExecutionStatus>({
    queryKey: ['execution-status'],
    queryFn: () => executionApi.getStatus().then(res => res.data as ExecutionStatus),
    refetchInterval: 5000, // Refresh every 5 seconds for real-time updates
    retry: 1, // Less retries for real-time data
    staleTime: 0, // Always consider stale for real-time updates
  });
};

export const useTriggerExecution = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: executionApi.triggerExecution,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['execution-status'] });
      queryClient.invalidateQueries({ queryKey: ['execution-history'] });
      queryClient.invalidateQueries({ queryKey: ['execution-statistics'] });
    },
    onError: (error) => {
      console.error('Failed to trigger execution:', error);
    },
  });
};
