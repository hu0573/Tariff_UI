// Cache Status Component
import React from 'react';
import { Badge } from './common/Badge';

export interface CacheStatusData {
  has_cache: boolean;
  is_valid: boolean;
  cache_path?: string;
  created_at?: string;
  expires_at?: number;
  expires_at_adelaide?: string;
  time_until_expiry?: string;
}

interface CacheStatusProps {
  status: CacheStatusData | null;
  isLoading?: boolean;
}

export const CacheStatus: React.FC<CacheStatusProps> = ({
  status,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="mb-4 flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700">Cache Status:</span>
        <span className="text-sm text-gray-500">Checking...</span>
      </div>
    );
  }

  if (!status || !status.has_cache) {
    return (
      <div className="mb-4 flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700">Cache Status:</span>
        <Badge className="bg-gray-100 text-gray-800">No Cache</Badge>
      </div>
    );
  }

  const getStatusInfo = () => {
    if (status.is_valid) {
      return {
        label: 'Valid',
        color: 'bg-green-100 text-green-800',
      };
    } else {
      return {
        label: 'Expired',
        color: 'bg-red-100 text-red-800',
      };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="mb-4 space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700">Cache Status:</span>
        <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
        {status.time_until_expiry && (
          <span className="text-sm text-gray-600">
            (Remaining: {status.time_until_expiry})
          </span>
        )}
      </div>
      {status.expires_at_adelaide && (
        <div className="text-xs text-gray-500">
          Expires At: {status.expires_at_adelaide}
        </div>
      )}
    </div>
  );
};
