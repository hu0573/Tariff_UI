// Automation API functions
import apiClient from './client';

export const automationApi = {
  // Legacy endpoints (kept for backward compatibility)
  start: () => apiClient.post('/api/automation/start'),
  stop: () => apiClient.post('/api/automation/stop'),
  getStatus: () => apiClient.get('/api/automation/status'),
  getWorkers: () => apiClient.get('/api/automation/workers'),
  
  // New unified automation endpoints
  getUnifiedStatus: () => apiClient.get('/api/automation/unified/status'),
  manualRun: () => apiClient.post('/api/automation/manual-run'),
  getActiveNodes: (params?: { node_type?: string; include_inactive?: boolean }) =>
    apiClient.get('/api/automation/unified/nodes', { params }),
  getTasks: (params?: { 
    node_type?: string; 
    status?: string; 
    limit?: number; 
    offset?: number;
  }) => apiClient.get('/api/automation/unified/tasks', { params }),
};
