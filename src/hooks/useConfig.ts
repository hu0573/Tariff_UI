// React Query hooks for configuration
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { configApi } from '@/api/config';

// SAPN configuration hooks
export const useSAPNConfig = () => {
  return useQuery({
    queryKey: ['sapn-config'],
    queryFn: () => configApi.getSAPNConfig().then(res => res.data),
  });
};

export const useUpdateSAPNConfig = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: configApi.updateSAPNConfig,
    onSuccess: async (response) => {
      // Refresh config after update
      await queryClient.invalidateQueries({ queryKey: ['sapn-config'] });
      await queryClient.invalidateQueries({ queryKey: ['initialization-status'] });
      
      // Show success message
      const { toastManager } = await import('@/components/common/Toast');
      if (response.data?.success) {
        toastManager.success('✓ SAPN configuration saved successfully!');
      } else {
        toastManager.error(`✗ ${response.data?.message || 'Failed to save configuration'}`);
      }
    },
    onError: async (error: any) => {
      console.error('Failed to update SAPN config:', error);
      
      // Check if it's a timeout - configuration might have been saved anyway
      const { toastManager } = await import('@/components/common/Toast');
      
      if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
        toastManager.info('⚠️ Request timeout. Configuration may have been saved. Please refresh the page to verify.');
      } else {
        const errorMsg = error?.response?.data?.detail || error?.response?.data?.message || error?.message || 'Failed to save configuration';
        toastManager.error(`✗ ${errorMsg}`);
      }
      
      // Still try to refresh config in case it was saved
      queryClient.invalidateQueries({ queryKey: ['sapn-config'] });
    },
  });
};

export const useTestSAPNConnection = () => {
  return useMutation({
    mutationFn: configApi.testSAPNConnection,
    onSuccess: async (response) => {
      const { toastManager } = await import('@/components/common/Toast');
      if (response.data?.success) {
        toastManager.success(`✓ Connection test successful! Found ${response.data?.nmi_count || 0} NMIs.`);
      } else {
        toastManager.error(`✗ ${response.data?.message || 'Connection test failed'}`);
      }
    },
    onError: async (error: any) => {
      const { toastManager } = await import('@/components/common/Toast');
      if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
        toastManager.error('✗ Connection test timeout. Please try again or check your credentials.');
      } else {
        const errorMsg = error?.response?.data?.detail || error?.response?.data?.message || error?.message || 'Connection test failed';
        toastManager.error(`✗ ${errorMsg}`);
      }
    },
  });
};

export const useNMIList = () => {
  return useQuery({
    queryKey: ['nmi-list'],
    queryFn: () => configApi.getNMIList().then(res => res.data),
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus
    retry: 2, // Retry failed requests twice
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });
};

export const useNMIStatistics = () => {
  return useQuery({
    queryKey: ['nmi-statistics'],
    queryFn: () => configApi.getNMIStatistics().then(res => res.data),
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus
    retry: 2, // Retry failed requests twice
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });
};

export const useRefreshNMIList = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => configApi.refreshNMIList(),
    onSuccess: async (response) => {
      // Refresh NMI list query after successful refresh
      await queryClient.invalidateQueries({ queryKey: ['nmi-list'] });
      
      const { toastManager } = await import('@/components/common/Toast');
      if (response.data?.success) {
        const count = response.data?.current_count || 0;
        const added = response.data?.added?.length || 0;
        const removed = response.data?.removed?.length || 0;
        let message = `✓ NMI list refreshed successfully! Found ${count} NMIs.`;
        if (added > 0 || removed > 0) {
          message += ` (${added > 0 ? `+${added} added` : ''}${added > 0 && removed > 0 ? ', ' : ''}${removed > 0 ? `-${removed} removed` : ''})`;
        }
        toastManager.success(message);
      } else {
        toastManager.error(`✗ ${response.data?.message || 'Failed to refresh NMI list'}`);
      }
    },
    onError: async (error: any) => {
      console.error('Failed to refresh NMI list:', error);
      const { toastManager } = await import('@/components/common/Toast');
      const errorMsg = error?.response?.data?.detail || error?.response?.data?.message || error?.message || 'Failed to refresh NMI list';
      toastManager.error(`✗ ${errorMsg}`);
    },
  });
};

// Server configuration hooks
export const useServerConfig = () => {
  return useQuery({
    queryKey: ['server-config'],
    queryFn: () => configApi.getServerConfig().then(res => res.data),
  });
};

export const useUpdateServerConfig = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: configApi.updateServerConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['server-config'] });
    },
  });
};

export const useTestServerConnection = () => {
  return useMutation({
    mutationFn: configApi.testServerConnection,
  });
};

// Refresh strategy hooks
export const useRefreshStrategy = () => {
  return useQuery({
    queryKey: ['refresh-strategy'],
    queryFn: () => configApi.getRefreshStrategy().then(res => res.data),
  });
};

export const useUpdateRefreshStrategy = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: configApi.updateRefreshStrategy,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['refresh-strategy'] });
    },
  });
};

export const useAddMonitoredNMI = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: configApi.addMonitoredNMI,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['refresh-strategy'] });
    },
  });
};

export const useUpdateNMIFrequency = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ nmi, refresh_frequency }: { nmi: string; refresh_frequency: string }) =>
      configApi.updateNMIFrequency(nmi, { refresh_frequency }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['refresh-strategy'] });
    },
  });
};

export const useRemoveMonitoredNMI = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: configApi.removeMonitoredNMI,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['refresh-strategy'] });
    },
  });
};

// MySQL configuration hooks
export const useMySQLConfig = () => {
  return useQuery({
    queryKey: ['mysql-config'],
    queryFn: () => configApi.getMySQLConfig().then(res => res.data),
  });
};

export const useUpdateMySQLConfig = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: configApi.updateMySQLConfig,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['mysql-config'] });
      await queryClient.invalidateQueries({ queryKey: ['initialization-status'] });
    },
  });
};

export const useTestMySQLConnection = () => {
  return useMutation({
    mutationFn: configApi.testMySQLConnection,
  });
};

export const useGetMySQLDatabases = () => {
  return useMutation({
    mutationFn: configApi.getMySQLDatabases,
  });
};

export const useCreateMySQLDatabase = () => {
  return useMutation({
    mutationFn: configApi.createMySQLDatabase,
  });
};
