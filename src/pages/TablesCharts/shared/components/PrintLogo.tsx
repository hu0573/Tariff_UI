import React from 'react';
import { useLocation } from 'react-router-dom';
import SolEnergyLogo from '@/assets/SolEnergy_logo.svg';

export const PrintLogo: React.FC = () => {
  const location = useLocation();
  const isPrintMode = location.hash.includes('pdf');

  if (!isPrintMode) return null;

  return (
    <div className="flex justify-center mb-6 w-full print-logo">
      <img
        src={SolEnergyLogo}
        alt="SolEnergy Logo"
        className="h-16 object-contain"
      />
    </div>
  );
};
