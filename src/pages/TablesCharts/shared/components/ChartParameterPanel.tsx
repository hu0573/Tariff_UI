import React, { useState, useEffect } from 'react';

export interface ChartParameterPanelProps {
  title?: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  className?: string;
  disableGrid?: boolean;
}

export const ChartParameterPanel: React.FC<ChartParameterPanelProps> = ({
  title = 'Configuration',
  children,
  defaultExpanded = true,
  className = '',
  disableGrid = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isOverflowVisible, setIsOverflowVisible] = useState(defaultExpanded);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (isExpanded) {
        // Wait for transition (300ms) to finish before allowing overflow
        timer = setTimeout(() => {
            setIsOverflowVisible(true);
        }, 300);
    } else {
        // Hide overflow immediately when starting to collapse
        setIsOverflowVisible(false);
    }
    return () => clearTimeout(timer);
  }, [isExpanded]);

  return (
    <div className={`bg-white rounded-lg shadow-md ${className}`}>
        <div 
            className="px-6 py-4 border-b border-gray-200 flex items-center justify-between cursor-pointer select-none"
            onClick={() => setIsExpanded(!isExpanded)}
        >
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          
          <button
            className="text-gray-500 hover:text-gray-700 focus:outline-none p-1 rounded-md hover:bg-gray-100 transition-colors"
            aria-label={isExpanded ? "Collapse" : "Expand"}
          >
            <svg 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                strokeWidth={1.5} 
                stroke="currentColor" 
                className={`w-5 h-5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
            >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
        </div>
        
      <div
        className={`transition-all duration-300 ease-in-out ${
          isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
        } ${isExpanded && isOverflowVisible ? 'overflow-visible' : 'overflow-hidden'}`}
      >
        <div className={`p-6 ${disableGrid ? '' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'}`}>
            {children}
        </div>
      </div>
    </div>
  );
};
