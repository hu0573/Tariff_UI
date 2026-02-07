import React from 'react';
import { Card } from '@/components/common/Card';
import { useLocation } from 'react-router-dom';

export interface NMIInfoCardProps {
  nmi: string;
  address?: string;
  className?: string;
  // potentially other info
}

export const NMIInfoCard: React.FC<NMIInfoCardProps> = ({
  nmi,
  address,
  className = '',
}) => {
  const location = useLocation();
  const isChartMode = location.hash.includes('chart');


  // Logic: "Usually hidden in #chart mode, displayed in interactive page or #pdf detail report"
  // If we follow this strictly:
  // Visible if !isChartMode OR isPrintMode (which is a subset of !isChartMode? No. Modes are mutually exclusive usually if we use hash. #pdf is different from #chart)
  // Wait, #pdf is for PDF generation. We WANT it in PDF.
  // #chart is for Screenshot. We usually DON'T want it in screenshot if it takes too much space, or maybe we DO? 
  // The spec says: "In #chart mode usually hidden".
  
  if (isChartMode) return null;

  if (!nmi) return null;

  return (
    <Card className={`mb-6 bg-blue-50 border-blue-100 ${className}`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
            NMI Details
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <h2 className="text-xl font-bold text-gray-900">{nmi}</h2>
            {address && (
              <span className="text-gray-600 text-sm">
                📍 {address}
              </span>
            )}
          </div>
        </div>
        
        {/* We can add more details here later */}
      </div>
    </Card>
  );
};
