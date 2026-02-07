// Task stage item component for displaying individual task stage status
import React from 'react';
import type { TaskStage } from '@/hooks/useExecution';

interface TaskStageItemProps {
  stage: TaskStage;
}

export const TaskStageItem: React.FC<TaskStageItemProps> = ({ stage }) => {
  const statusStyles = {
    running: 'border-blue-500 bg-blue-50',
    completed: 'border-green-500 bg-green-50',
    failed: 'border-red-500 bg-red-50',
    waiting: 'border-gray-300 bg-gray-50',
    skipped: 'border-yellow-500 bg-yellow-50',
  };

  const statusIcons = {
    completed: '✓',
    running: '⟳',
    failed: '✗',
    waiting: '○',
    skipped: '⊘',
  };

  const statusColors = {
    running: 'text-blue-700',
    completed: 'text-green-700',
    failed: 'text-red-700',
    waiting: 'text-gray-700',
    skipped: 'text-yellow-700',
  };

  return (
    <div className={`flex items-center justify-between p-3 rounded-lg border-2 ${statusStyles[stage.status]}`}>
      <div className="flex items-center gap-3 flex-1">
        {/* Status Icon */}
        <span className={`text-lg ${statusColors[stage.status]} ${
          stage.status === 'running' ? 'animate-spin' : ''
        }`}>
          {statusIcons[stage.status]}
        </span>
        
        {/* Task Name and Message */}
        <div className="flex-1">
          <span className={`font-medium ${statusColors[stage.status]}`}>
            {stage.name}
          </span>
          {stage.message && (
            <div className="text-xs text-gray-600 mt-1">
              {stage.message}
            </div>
          )}
        </div>
      </div>
      
      {/* Execution Time / Status */}
      <div className="text-right">
        {stage.execution_time !== null && (
          <span className="text-sm text-gray-600 font-medium">
            {stage.execution_time.toFixed(1)}s
          </span>
        )}
        {stage.status === 'running' && (
          <span className="text-sm text-blue-600 font-medium animate-pulse ml-2">
            Running...
          </span>
        )}
      </div>
    </div>
  );
};
