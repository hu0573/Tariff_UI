// Execution History API functions
import apiClient from './client';

export interface ExecutionCycle {
  id: number;
  task_type: string;
  start_time_utc: number;
  completed_at_utc: number | null;
  status: string;
  error_message: string | null;
  details: {
    total_tasks: number;
    success_count: number;
    failed_count: number;
    skipped_count?: number;
    status: string;
    request?: Record<string, any>;
    progress_percent?: number;
    current_task?: string;
  };
}

export interface SubTask {
  id: number;
  parent_cycle_id: number;
  task_type: string;
  start_time_utc: number;
  completed_at_utc: number | null;
  status: string;
  error_message: string | null;
  details: Record<string, any>;
}

export interface ExecutionCyclesResponse {
  data: ExecutionCycle[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface SubTasksResponse {
  cycle_id: number;
  tasks: SubTask[];
}

export const executionHistoryApi = {
  // Get paginated list of execution cycles
  getExecutionCycles: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    start_date?: string;
    end_date?: string;
  }) => apiClient.get<ExecutionCyclesResponse>('/api/automation/execution-cycles', { params }),

  // Get single execution cycle details
  getExecutionCycle: (id: number) =>
    apiClient.get<ExecutionCycle>(`/api/automation/execution-cycles/${id}`),

  // Get sub-tasks for an execution cycle
  getSubTasks: (cycleId: number) =>
    apiClient.get<SubTasksResponse>(`/api/automation/execution-cycles/${cycleId}/tasks`),
};
