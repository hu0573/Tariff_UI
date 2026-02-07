// Execution API functions
import apiClient from './client';

export const executionApi = {
  getHistory: (params?: {
    page?: number;
    limit?: number;
    start_utc_timestamp?: number;
    end_utc_timestamp?: number;
  }) => apiClient.get('/api/execution/history', { params }),
  
  getStatistics: (days?: number) =>
    apiClient.get('/api/execution/statistics', { params: { days } }),
  
  getStatus: () => apiClient.get('/api/execution/status'),
  
  triggerExecution: (data: { nmi_list?: string[]; force?: boolean }) =>
    apiClient.post('/api/execution/trigger', data),
};
