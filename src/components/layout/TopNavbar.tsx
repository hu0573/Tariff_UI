// Top horizontal navigation bar component
import React from "react";
import SolEnergyLogo from "@/assets/SolEnergy_logo.svg";

interface TopNavItem {
  id: string;
  label: string;
  path?: string; // Optional, for direct navigation
}

const topNavItems: TopNavItem[] = [
  { id: "data-acquisition", label: "Data Acquisition" },
  { id: "data-configuration", label: "Data Configuration" },
  { id: "tables-charts", label: "Tables & Charts" },
  { id: "report-generation", label: "Report Generation" },
  { id: "settings", label: "Settings" },
];

interface TopNavbarProps {
  activeSection: string;
  onSectionChange: (sectionId: string) => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  activeSection,
  onSectionChange,
}) => {
  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Company Logo */}
          <div className="flex items-center">
            <img
              src={SolEnergyLogo}
              alt="SolEnergy Logo"
              className="h-8 w-auto"
            />
            <span className="ml-4 text-xl font-semibold text-gray-800">
              Energy Management Portal
            </span>
          </div>
          
          <div className="text-sm text-gray-500">
            Demo Version
          </div>
        </div>
      </div>
    </nav>
  );
};
