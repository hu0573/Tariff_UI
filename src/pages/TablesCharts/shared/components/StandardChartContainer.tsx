import React from 'react';
import { useLocation } from 'react-router-dom';
import { Loading } from '@/components/common/Loading';


// Extend the Window interface to include our custom signal
declare global {
  interface Window {
    __CHART_LOADED__?: boolean;
  }
}

export interface StandardChartContainerProps {
  children: React.ReactNode;
  isLoading?: boolean;
  className?: string;
  gridClassName?: string;
  chartType?: string;
  manualReadySignal?: boolean;
}

export const StandardChartContainer: React.FC<StandardChartContainerProps> = ({
  children,
  isLoading = false,
  className = '',
  gridClassName = '',
  chartType,
  manualReadySignal = false,
}) => {
  const location = useLocation();
  const isPrintMode = location.hash.includes('pdf');
  const isChartMode = location.hash.includes('chart');

  // Signal to the backend worker that the chart is fully loaded and ready for screenshot
  React.useEffect(() => {
    // Only engage this logic if we are in chart mode (which is used by the worker)
    if (isChartMode) {
      if (isLoading) {
        // If loading starts (or restarts), reset the signal
        window.__CHART_LOADED__ = false;
      } else if (!manualReadySignal) {
        // If loading finishes and we're not in manual mode, 
        // give a short buffer for rendering/animations, then signal readiness
        const timer = setTimeout(() => {
          window.__CHART_LOADED__ = true;
        }, 800); 
        return () => clearTimeout(timer);
      }
    }

    // Cleanup: always reset signal when component unmounts or dependencies change
    return () => {
      // We don't necessarily need to reset on every render, but resetting on unmount is safe.
    };
  }, [isLoading, isChartMode, location.search, manualReadySignal]); // Add location.search to catch param changes

  // Defines the styles for print/chart modes
  // This is injected directly into the document head
  const printStyles = `
    @media print {
      body { padding: 0 !important; margin: 0 !important; }
      @page { size: auto; margin: 0mm; }
      .print-hide { display: none !important; }
      .print-container { width: 210mm !important; margin: 0 auto !important; }
    }
    
    /* Styles for #chart mode (screenshot generation) */
    ${isChartMode ? `
      body { background: white !important; }
      #root { padding: 0 !important; margin: 0 !important; }
      main { padding: 0 !important; margin: 0 !important; width: 100% !important; max-width: 100% !important; }
      .print-hide { display: none !important; }
    ` : ''}

    /* Styles for #pdf mode - force A4 width on screen for preview */
    ${isPrintMode ? `
        .print-hide { display: none !important; }
        .print-container { width: 210mm !important; margin: 0 auto !important; }
    ` : ''}
  `;

  return (
    <div className={`relative min-h-screen ${className}`}>
      <style>{printStyles}</style>

      {/* Global Loading Mask for Screenshots */}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 loading-mask">
          <Loading size="lg" />
        </div>
      )}

      {/* Main Container */}
      <div 
        className={`
          transition-all duration-300
          ${isPrintMode ? 'print-container mx-auto bg-white p-8 shadow-lg' : 'w-full'}
          ${isChartMode ? 'w-full bg-white' : ''}
          ${(!isPrintMode && !isChartMode) ? 'space-y-6' : ''}
        `}
        data-chart-type={isChartMode ? chartType : undefined}
      >
        <div className={gridClassName}>
            {children}
        </div>
      </div>
    </div>
  );
};
