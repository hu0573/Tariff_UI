// Tooltip component
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'bottom',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isVisible) {
      setTooltipPosition(null);
      return;
    }

    if (!triggerRef.current) return;

    const updatePosition = () => {
      if (!triggerRef.current) return;
      
      const triggerRect = triggerRef.current.getBoundingClientRect();
      
      // If tooltip element exists, get its rect, otherwise estimate
      let tooltipWidth = 200; // Estimate width
      let tooltipHeight = 60; // Estimate height
      
      if (tooltipRef.current) {
        const tooltipRect = tooltipRef.current.getBoundingClientRect();
        if (tooltipRect.width > 0 && tooltipRect.height > 0) {
          tooltipWidth = tooltipRect.width;
          tooltipHeight = tooltipRect.height;
        }
      }
      
      let top = 0;
      let left = 0;
      
      switch (position) {
        case 'top':
          top = triggerRect.top - tooltipHeight - 8;
          left = triggerRect.left + triggerRect.width / 2 - tooltipWidth / 2;
          break;
        case 'bottom':
          top = triggerRect.bottom + 8;
          left = triggerRect.left + triggerRect.width / 2 - tooltipWidth / 2;
          break;
        case 'left':
          top = triggerRect.top + triggerRect.height / 2 - tooltipHeight / 2;
          left = triggerRect.left - tooltipWidth - 8;
          break;
        case 'right':
          top = triggerRect.top + triggerRect.height / 2 - tooltipHeight / 2;
          left = triggerRect.right + 8;
          break;
      }
      
      // Keep tooltip within viewport
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      if (left < 8) left = 8;
      if (left + tooltipWidth > viewportWidth - 8) {
        left = viewportWidth - tooltipWidth - 8;
      }
      if (top < 8) top = 8;
      if (top + tooltipHeight > viewportHeight - 8) {
        top = viewportHeight - tooltipHeight - 8;
      }
      
      setTooltipPosition({ top, left });
      
      // Update position again after tooltip is rendered to get accurate dimensions
      if (tooltipRef.current) {
        requestAnimationFrame(() => {
          if (!triggerRef.current || !tooltipRef.current) return;
          const finalRect = tooltipRef.current.getBoundingClientRect();
          if (finalRect.width > 0 && finalRect.height > 0) {
            const triggerRect = triggerRef.current.getBoundingClientRect();
            let finalTop = 0;
            let finalLeft = 0;
            
            switch (position) {
              case 'top':
                finalTop = triggerRect.top - finalRect.height - 8;
                finalLeft = triggerRect.left + triggerRect.width / 2 - finalRect.width / 2;
                break;
              case 'bottom':
                finalTop = triggerRect.bottom + 8;
                finalLeft = triggerRect.left + triggerRect.width / 2 - finalRect.width / 2;
                break;
              case 'left':
                finalTop = triggerRect.top + triggerRect.height / 2 - finalRect.height / 2;
                finalLeft = triggerRect.left - finalRect.width - 8;
                break;
              case 'right':
                finalTop = triggerRect.top + triggerRect.height / 2 - finalRect.height / 2;
                finalLeft = triggerRect.right + 8;
                break;
            }
            
            // Keep within viewport
            if (finalLeft < 8) finalLeft = 8;
            if (finalLeft + finalRect.width > viewportWidth - 8) {
              finalLeft = viewportWidth - finalRect.width - 8;
            }
            if (finalTop < 8) finalTop = 8;
            if (finalTop + finalRect.height > viewportHeight - 8) {
              finalTop = viewportHeight - finalRect.height - 8;
            }
            
            setTooltipPosition({ top: finalTop, left: finalLeft });
          }
        });
      }
    };
    
    // Initial position estimate
    updatePosition();
  }, [isVisible, position]);

  const arrowClasses = {
    top: 'top-full left-1/2 transform -translate-x-1/2 border-t-gray-900 border-t-4 border-x-transparent border-x-4',
    bottom: 'bottom-full left-1/2 transform -translate-x-1/2 border-b-gray-900 border-b-4 border-x-transparent border-x-4',
    left: 'left-full top-1/2 transform -translate-y-1/2 border-l-gray-900 border-l-4 border-y-transparent border-y-4',
    right: 'right-full top-1/2 transform -translate-y-1/2 border-r-gray-900 border-r-4 border-y-transparent border-y-4',
  };

  const tooltipElement = isVisible && content && tooltipPosition && (
    <div
      ref={tooltipRef}
      className="fixed z-[9999] px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg pointer-events-none"
      style={{
        top: `${tooltipPosition.top}px`,
        left: `${tooltipPosition.left}px`,
        maxWidth: '400px',
        whiteSpace: 'pre-line',
      }}
    >
      {typeof content === 'string' ? (
        content.split('\n').map((line, index, array) => (
          <React.Fragment key={index}>
            {line}
            {index < array.length - 1 && <br />}
          </React.Fragment>
        ))
      ) : (
        content
      )}
      {/* Arrow */}
      <div className={`absolute w-0 h-0 ${arrowClasses[position]}`} />
    </div>
  );

  return (
    <>
      <span
        ref={triggerRef}
        className="inline-block"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
      </span>
      {typeof document !== 'undefined' && createPortal(tooltipElement, document.body)}
    </>
  );
};
