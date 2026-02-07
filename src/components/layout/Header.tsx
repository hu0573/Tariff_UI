// Page header component
import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">
            SA Power Networks Automation
          </h1>
          <div className="flex items-center gap-4">
            {/* Add any header actions here, e.g., user menu, notifications */}
          </div>
        </div>
      </div>
    </header>
  );
};
