import apiClient from './client';

export interface BatchGenerateRequest {
  template_id: string;
  nmis: string[];
  parameters?: Record<string, number | string>;
}

export interface BatchGenerateResponse {
  success?: boolean;
  task_id: number;
  status: string;
  message?: string;
}

export interface ReportTask {
  id: number;
  status: string;
  created_at_utc: number;
  updated_at_utc?: number;
  details?: {
    requirement?: {
      template_id?: string;
      nmis?: string[];
      parameters?: Record<string, number | string>;
    };
    status?: {
      overall_percentage?: number;
      current_nmi?: string;
      completed_count?: number;
      total_count?: number;
      current_nmi_charts_total?: number;
      current_nmi_charts_completed?: number;
      logs?: Array<{ time: number; msg: string }>;
    };
  };
}

export interface ReportTasksResponse {
  total: number;
  tasks: ReportTask[];
  error?: string;
}

export interface ReportTaskResult {
  report_id: number;
  nmi: string;
  status: string;
  download_url: string;
  created_at_utc?: number;
}

export interface ReportTaskResultsResponse {
  task_id: number;
  results: ReportTaskResult[];
  error?: string;
}

export const reportApi = {
  batchGenerate: async (request: BatchGenerateRequest): Promise<BatchGenerateResponse> => {
    const response = await apiClient.post<BatchGenerateResponse>(
      '/api/report/batch-generate',
      request
    );
    return response.data;
  },
  getTasks: async (limit = 20, offset = 0): Promise<ReportTasksResponse> => {
    const response = await apiClient.get<ReportTasksResponse>(
      `/api/report/tasks?limit=${limit}&offset=${offset}`
    );
    return response.data;
  },
  getTaskResults: async (taskId: number): Promise<ReportTaskResultsResponse> => {
    const response = await apiClient.get<ReportTaskResultsResponse>(
      `/api/report/tasks/${taskId}/results`
    );
    return response.data;
  },
  downloadReport: async (reportId: number): Promise<Blob> => {
    const response = await apiClient.get(`/api/report/download/${reportId}`, {
      responseType: 'blob',
    });
    return response.data as Blob;
  },
};
