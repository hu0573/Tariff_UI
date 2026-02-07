// React Query hooks for initialization
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { configApi } from '@/api/config';
import type { InitializationStatus, CompleteInitializationResponse, NMIVerificationResponse } from '@/types/initialization';

/**
 * Hook to get initialization status
 * Caches the status for 30 seconds to avoid frequent API calls
 */
export const useInitializationStatus = () => {
  return useQuery<InitializationStatus>({
    queryKey: ['initialization-status'],
    queryFn: () => configApi.getInitializationStatus().then(res => res.data),
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: false, // Don't refetch on window focus
    retry: 2, // Retry failed requests twice
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });
};

/**
 * Hook to complete initialization
 * Invalidates initialization status query on success
 */
export const useCompleteInitialization = () => {
  const queryClient = useQueryClient();
  
  return useMutation<{ data: CompleteInitializationResponse }, Error>({
    mutationFn: () => configApi.completeInitialization(),
    onSuccess: async () => {
      // Invalidate and refetch initialization status
      await queryClient.invalidateQueries({ queryKey: ['initialization-status'] });
      
      // Show success message
      const { toastManager } = await import('@/components/common/Toast');
      toastManager.success('✓ Initialization completed successfully!');
    },
    onError: async (error: any) => {
      console.error('Failed to complete initialization:', error);
      
      const { toastManager } = await import('@/components/common/Toast');
      const errorMsg = error?.response?.data?.detail || error?.response?.data?.message || error?.message || 'Failed to complete initialization';
      toastManager.error(`✗ ${errorMsg}`);
    },
  });
};

/**
 * Hook to verify NMI data in database
 */
export const useVerifyNMIData = () => {
  return useQuery<NMIVerificationResponse>({
    queryKey: ['nmi-verification'],
    queryFn: () => configApi.verifyNMIData().then(res => res.data),
    staleTime: 10 * 1000, // 10 seconds
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};
