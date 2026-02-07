import { useState, useEffect } from 'react';
import { useServerConfig, useUpdateServerConfig, useTestServerConnection } from '@/hooks/useConfig';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Loading } from '@/components/common/Loading';
import { ErrorMessage } from '@/components/common/ErrorMessage';

export function FileUploadConfig() {
  const { data: config, isLoading: configLoading } = useServerConfig();
  const updateMutation = useUpdateServerConfig();
  const testMutation = useTestServerConnection();

  const [host, setHost] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [port, setPort] = useState(22);
  const [remoteDir, setRemoteDir] = useState('');
  const [isTestMode, setIsTestMode] = useState(false);

  // Initialize form with current config
  useEffect(() => {
    if (config) {
      setHost(config.host || '');
      setUsername(config.username || '');
      setPort(config.port || 22);
      setRemoteDir(config.remote_dir || '');
    }
  }, [config]);

  const handleTest = () => {
    if (!host || !username || !password) {
      return;
    }
    setIsTestMode(true);
    testMutation.mutate(
      { host, username, password, port, remote_dir: remoteDir },
      {
        onSettled: () => {
          // Reset isTestMode after a short delay to allow result display
          setTimeout(() => {
            setIsTestMode(false);
          }, 100);
        },
      }
    );
  };

  const handleSave = () => {
    if (!host || !username || !password) {
      return;
    }
    updateMutation.mutate({ host, username, password, port, remote_dir: remoteDir });
  };

  if (configLoading) {
    return <Loading />;
  }

  // Cast config to explicit type or use type guards
  const currentConfig: any = config || {};

  return (
    <div className="space-y-6">
      {/* Current Configuration Display */}
      <Card title="Current Configuration">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Host:</span>
            <span className="font-medium">{currentConfig.host || 'Not configured'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Username:</span>
            <span className="font-medium">{currentConfig.username || 'Not configured'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Password:</span>
            <span className="font-medium">••••••••</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Port:</span>
            <span className="font-medium">{currentConfig.port || 22}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Remote Directory:</span>
            <span className="font-medium">{currentConfig.remote_dir || 'Not configured'}</span>
          </div>
          {currentConfig.connection_status && (
            <div className="flex justify-between">
              <span className="text-gray-600">Connection Status:</span>
              <Badge variant={currentConfig.connection_status === 'connected' ? 'success' : 'default'}>
                {currentConfig.connection_status}
              </Badge>
            </div>
          )}
          {currentConfig.path_accessible !== undefined && (
            <div className="flex justify-between">
              <span className="text-gray-600">Path Accessible:</span>
              <Badge variant={currentConfig.path_accessible ? 'success' : 'error'}>
                {currentConfig.path_accessible ? 'Yes' : 'No'}
              </Badge>
            </div>
          )}
        </div>
      </Card>

      {/* Update Configuration Form */}
      <Card title="Update Configuration">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Host</label>
            <input
              type="text"
              value={host}
              onChange={(e) => setHost(e.target.value)}
              placeholder="Enter server hostname or IP"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter SSH username"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter SSH password"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Port</label>
            <input
              type="number"
              value={port}
              onChange={(e) => setPort(parseInt(e.target.value) || 22)}
              placeholder="Enter SSH port (default: 22)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Remote Directory</label>
            <input
              type="text"
              value={remoteDir}
              onChange={(e) => setRemoteDir(e.target.value)}
              placeholder="Enter remote directory path"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={handleTest}
              loading={testMutation.isPending && isTestMode}
              disabled={!host || !username || !password}
            >
              Test Connection
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              loading={updateMutation.isPending}
              disabled={!host || !username || !password}
            >
              Save Configuration
            </Button>
          </div>
        </div>
      </Card>

      {/* Test Result - Success */}
      {testMutation.isSuccess && (
        <Card>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-green-600">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="font-medium">Connection test successful!</span>
            </div>
            {testMutation.data?.data?.path_accessible !== undefined && (
              <div className="flex items-center gap-2 text-sm">
                <Badge variant={testMutation.data.data.path_accessible ? 'success' : 'error'}>
                  Path Accessible: {testMutation.data.data.path_accessible ? 'Yes' : 'No'}
                </Badge>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Test Result - Error */}
      {testMutation.isError && (
        <Card>
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="flex-1">
                <p className="text-red-900 font-medium">Connection test failed</p>
                <p className="text-sm text-red-700 mt-1">
                  {(testMutation.error as any)?.response?.data?.detail || 
                   (testMutation.error as any)?.response?.data?.message || 
                   testMutation.error?.message || 
                   'Unknown error occurred'}
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Save Result */}
      {updateMutation.isSuccess && (
        <Card>
          <div className="flex items-center gap-2 text-green-600">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-medium">Configuration saved successfully!</span>
          </div>
        </Card>
      )}

      {updateMutation.isError && (
        <ErrorMessage message={`Failed to save configuration: ${updateMutation.error?.message || 'Unknown error'}`} />
      )}
    </div>
  );
}
