// Automation Progress Card component
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { TaskStageItem } from './TaskStageItem';
import type { ExecutionStatus } from '@/hooks/useExecution';
import { addDays, intervalToDuration } from 'date-fns';
import { formatToSATime } from '@/utils/timeFormat';
import { useRefreshStrategy } from '@/hooks/useConfig';

interface AutomationProgressCardProps {
  isRunning: boolean;
  automationStatus?: { started_at?: number | null };
  executionStatus?: ExecutionStatus | null;
  hasActiveWorkers?: boolean;
}

export const AutomationProgressCard: React.FC<AutomationProgressCardProps> = ({
  isRunning,
  automationStatus,
  executionStatus,
  hasActiveWorkers = true,
}) => {
  const { data: refreshStrategy } = useRefreshStrategy();
  const [timeLeft, setTimeLeft] = useState<string>('');
  
  // Hardcoded 3:00 AM logic as per requirement, or fetch from config
  const targetTimeStr = refreshStrategy?.automation_config?.refresh_time || '03:00';

  useEffect(() => {
    if (isRunning) return;

    const calculateTimeLeft = () => {
      const now = new Date();
      const [hours, minutes] = targetTimeStr.split(':').map(Number);
      
      let targetDate = new Date();
      targetDate.setHours(hours, minutes, 0, 0);

      if (now > targetDate) {
        targetDate = addDays(targetDate, 1);
      }

      const duration = intervalToDuration({ start: now, end: targetDate });
      
      const parts = [];
      if (duration.hours) parts.push(`${duration.hours}h`);
      if (duration.minutes) parts.push(`${duration.minutes}m`);
      if (!duration.hours && !duration.minutes && duration.seconds) parts.push(`${duration.seconds}s`);
      if (!parts.length) parts.push("0m");

      setTimeLeft(parts.join(' '));
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 60000); // Update every minute

    return () => clearInterval(timer);
  }, [isRunning, targetTimeStr]);

  return (
    <Card title="Automation Progress">
      {/* System Status Header */}
      <div className="flex items-center gap-4 mb-4">
        {!hasActiveWorkers ? (
           <Badge variant="error" className="animate-pulse">
             🔴 UNAVAILABLE
           </Badge>
        ) : (
          <Badge variant={isRunning ? 'success' : 'default'}>
            {isRunning ? '🟢 RUNNING' : '⚫ STOPPED'}
          </Badge>
        )}

        {isRunning && automationStatus?.started_at && (
          <span className="text-sm text-gray-600">
            Started: {formatToSATime(automationStatus.started_at)}
          </span>
        )}
      </div>

      {/* Task Stages List */}
      {isRunning && executionStatus?.progress?.task_stages && executionStatus.progress.task_stages.length > 0 && (
        <div className="space-y-3">
          {/* Current Stage Indicator */}
          {executionStatus.progress.current_task && (
            <div className="text-sm font-medium text-gray-700 mb-3">
              Current Stage: <span className="text-blue-600">{executionStatus.progress.current_task}</span>
            </div>
          )}
          
          {/* Task Stage Items */}
          <div className="space-y-2">
            {executionStatus.progress.task_stages.map((stage, index) => (
              <TaskStageItem key={index} stage={stage} />
            ))}
          </div>
          
          {/* Overall Progress Bar */}
          <div className="mt-4 pt-4 border-t">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium text-gray-700">Overall Progress</span>
              <span className="font-semibold text-gray-900">
                {executionStatus.progress.percentage.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${executionStatus.progress.percentage}%` }}
              />
            </div>
            <div className="flex gap-4 text-sm">
              <span className="text-green-600 font-medium">
                ✓ {executionStatus.progress.success} completed
              </span>
              <span className="text-red-600 font-medium">
                ✗ {executionStatus.progress.failed} failed
              </span>
            </div>
          </div>
        </div>
      )}
      
      {/* Empty State / Scheduled Info */}
      {!isRunning && (
        <div className="bg-gray-50 rounded-lg p-6 border-2 border-dashed border-gray-200">
           <div className="flex flex-col items-center justify-center text-center">
               <div className="text-gray-400 mb-2">
                   {hasActiveWorkers ? (
                     <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                   ) : (
                     <svg className="w-10 h-10 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                   )}
               </div>
               
               {hasActiveWorkers ? (
                 <>
                   <h4 className="text-gray-900 font-medium text-lg">Automation is stopped</h4>
                   <p className="text-gray-500 mb-4">No active stages.</p>
                   
                   <div className="bg-blue-50 text-blue-800 px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
                      <span>Next scheduled run in:</span>
                      <span className="font-bold text-blue-900">{timeLeft || '--'}</span>
                      <span className="text-blue-600 text-xs">(at {targetTimeStr})</span>
                   </div>
                 </>
               ) : (
                 <>
                   <h4 className="text-red-600 font-medium text-lg">System Unavailable</h4>
                   <p className="text-gray-500 mb-2">Crawler subsystem is offline.</p>
                   <p className="text-gray-400 text-sm">No active nodes to execute tasks.</p>
                 </>
               )}
           </div>
        </div>
      )}
    </Card>
  );
};
