import { useState, useEffect } from 'react';
import { useMySQLConfig, useUpdateMySQLConfig, useTestMySQLConnection, useGetMySQLDatabases, useCreateMySQLDatabase } from '@/hooks/useConfig';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Loading } from '@/components/common/Loading';
import { ErrorMessage } from '@/components/common/ErrorMessage';

interface MySQLUploadConfigProps {
  onSuccess?: (initializationStatus?: any) => void;
}

export function MySQLUploadConfig({ onSuccess }: MySQLUploadConfigProps) {
  const { data: config, isLoading: configLoading, refetch: refetchConfig } = useMySQLConfig();
  const updateMutation = useUpdateMySQLConfig();
  const testMutation = useTestMySQLConnection();
  const getDatabasesMutation = useGetMySQLDatabases();
  const createDatabaseMutation = useCreateMySQLDatabase();

  const [host, setHost] = useState('');
  const [port, setPort] = useState(3306);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [database, setDatabase] = useState('');
  const [databaseList, setDatabaseList] = useState<string[]>([]);
  const [isTestMode, setIsTestMode] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newDatabaseName, setNewDatabaseName] = useState('meter_data_platform');
  const [showCreateDatabase, setShowCreateDatabase] = useState(false);

  // Initialize form with current config
  useEffect(() => {
    if (config) {
      setHost(config.host || '');
      setPort(config.port || 3306);
      setUsername(config.username || '');
      setDatabase(config.database || '');
    }
  }, [config]);

  const handleTestConnection = async () => {
    if (!host || !username || !password) {
      return;
    }
    setIsTestMode(true);
    testMutation.mutate(
      { host, port, username, password },
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

  const handleFetchDatabases = async () => {
    if (!host || !username || !password) {
      return;
    }
    getDatabasesMutation.mutate(
      { host, port, username, password },
      {
        onSuccess: (response) => {
          if (response.data?.success && response.data?.databases) {
            setDatabaseList(response.data.databases);
          }
        },
      }
    );
  };

  const handleCreateDatabase = async () => {
    if (!host || !username || !password || !newDatabaseName) {
      return;
    }
    setIsCreating(true);
    createDatabaseMutation.mutate(
      { host, port, username, password, database_name: newDatabaseName },
      {
        onSuccess: (response) => {
          if (response.data?.success) {
            setDatabase(newDatabaseName);
            setShowCreateDatabase(false);
            setNewDatabaseName('');
            // Refresh database list
            handleFetchDatabases();
          }
        },
        onSettled: () => {
          setIsCreating(false);
        },
      }
    );
  };

  const handleSave = () => {
    if (!host || !username || !password || !database) {
      return;
    }
    updateMutation.mutate(
      { host, port, username, password, database, enabled: true },
      {
        onSuccess: (response) => {
          if (response.data?.success) {
            // Refetch config to update the "Current Configuration" display
            refetchConfig();
            
            // Call the success callback if provided
            if (onSuccess) {
              onSuccess(response.data.initialization_status);
            }
          }
        },
      }
    );
  };

  if (configLoading) {
    return <Loading />;
  }

  const currentConfig = config || {};

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
            <span className="text-gray-600">Port:</span>
            <span className="font-medium">{currentConfig.port || 3306}</span>
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
            <span className="text-gray-600">Database:</span>
            <span className="font-medium">{currentConfig.database || 'Not configured'}</span>
          </div>
          {currentConfig.enabled !== undefined && (
            <div className="flex justify-between">
              <span className="text-gray-600">Enabled:</span>
              <Badge variant={currentConfig.enabled ? 'success' : 'default'}>
                {currentConfig.enabled ? 'Yes' : 'No'}
              </Badge>
            </div>
          )}
        </div>
      </Card>

      {/* Update Configuration Form */}
      <Card title="Update Configuration">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">MySQL Host</label>
            <input
              type="text"
              value={host}
              onChange={(e) => setHost(e.target.value)}
              placeholder="Enter MySQL server hostname or IP"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">MySQL Port</label>
            <input
              type="number"
              value={port}
              onChange={(e) => setPort(parseInt(e.target.value) || 3306)}
              placeholder="Enter MySQL port (default: 3306)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter MySQL username"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter MySQL password"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Database Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Database</label>
            <div className="flex gap-2">
              <select
                value={database}
                onChange={(e) => setDatabase(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={databaseList.length === 0}
              >
                <option value="">Select a database</option>
                {databaseList.map((db) => (
                  <option key={db} value={db}>
                    {db}
                  </option>
                ))}
              </select>
              <Button
                variant="secondary"
                onClick={handleFetchDatabases}
                loading={getDatabasesMutation.isPending}
                disabled={!host || !username || !password}
              >
                Refresh
              </Button>
            </div>
            {databaseList.length === 0 && getDatabasesMutation.isSuccess && (
              <p className="mt-1 text-sm text-gray-500">No databases found. Create a new one below.</p>
            )}
          </div>

          {/* Create Database */}
          {!showCreateDatabase ? (
            <div>
              <Button
                variant="secondary"
                onClick={() => setShowCreateDatabase(true)}
                disabled={!host || !username || !password}
              >
                Create New Database
              </Button>
            </div>
          ) : (
            <div className="p-4 border border-gray-200 rounded-md bg-gray-50">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">New Database Name</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newDatabaseName}
                    onChange={(e) => setNewDatabaseName(e.target.value)}
                    placeholder="Enter database name"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Button
                    variant="primary"
                    onClick={handleCreateDatabase}
                    loading={isCreating}
                    disabled={!newDatabaseName}
                  >
                    Create
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setShowCreateDatabase(false);
                      setNewDatabaseName('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={handleTestConnection}
              loading={testMutation.isPending && isTestMode}
              disabled={!host || !username || !password}
            >
              Test Connection
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              loading={updateMutation.isPending}
              disabled={!host || !username || !password || !database}
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
            {testMutation.data?.data?.version && (
              <div className="text-sm text-gray-600">
                MySQL Version: {testMutation.data.data.version}
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

      {/* Create Database Result */}
      {createDatabaseMutation.isSuccess && (
        <Card>
          <div className="flex items-center gap-2 text-green-600">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-medium">Database created successfully!</span>
          </div>
        </Card>
      )}

      {createDatabaseMutation.isError && (
        <ErrorMessage message={`Failed to create database: ${createDatabaseMutation.error?.message || 'Unknown error'}`} />
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
