// CrawlerStatusCard component
import { Badge } from '@/components/common/Badge';
import { Card } from '@/components/common/Card';
import { useActiveWorkers } from '@/hooks/useAutomation';
import { ComputerDesktopIcon } from '@heroicons/react/24/outline';

export function CrawlerStatusCard() {
  const { data, isLoading, error } = useActiveWorkers();

  if (isLoading) {
    return (
      <Card title="Crawler System Status">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card title="Crawler System Status">
        <div className="text-red-500">Failed to load crawler status.</div>
      </Card>
    );
  }

  const activeWorkers = data?.active_workers || [];
  const hasWorkers = activeWorkers.length > 0;

  return (
    <Card title="Crawler System Status">
      <div className="space-y-4">
        {/* Status Header */}
        <div className="flex items-center gap-4">
          <Badge 
            variant={hasWorkers ? 'success' : 'error'} 
            className="text-lg px-4 py-1.5 font-semibold flex items-center gap-2"
          >
            <div className={`w-3 h-3 rounded-full ${hasWorkers ? 'bg-green-200 animate-pulse' : 'bg-red-200'}`} />
            {hasWorkers ? 'ONLINE' : 'OFFLINE'}
          </Badge>
          {!hasWorkers && (
            <span className="text-gray-500 text-sm">No active crawler workers found.</span>
          )}
        </div>
        


        {/* Workers List */}
        {hasWorkers && (
          <div className="grid gap-3">
             <div className="text-sm font-medium text-gray-700">Active Nodes:</div>
             {activeWorkers.map((worker: any) => (
                <div key={worker.id} className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                          <ComputerDesktopIcon className="w-5 h-5" />
                      </div>
                      <div>
                          <div className="font-semibold text-gray-900">{worker.hostname}</div>
                          <div className="text-xs text-gray-500 font-mono">{worker.ip_address}</div>
                      </div>
                   </div>
                   <div className="text-right">
                       <Badge variant="success" className="mb-1">Active</Badge>
                       <div className="text-xs text-gray-500">
                           Last seen: {worker.seconds_ago}s ago
                       </div>
                   </div>
                </div>
             ))}
          </div>
        )}

        {/* Offline Message */}
        {!hasWorkers && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="ml-3">
                        <p className="text-sm text-red-700">
                            The crawler subsystem appears to be offline.
                            Please check if the <code>subsystems/crawler_worker/worker.py</code> process is running.
                        </p>
                    </div>
                </div>
            </div>
        )}
      </div>
    </Card>
  );
}
