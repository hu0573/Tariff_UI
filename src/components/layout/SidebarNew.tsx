// New sidebar component with expandable second-level menus
import React from "react";
import { NavLink } from "react-router-dom";
import { ChevronRightIcon } from "@heroicons/react/24/outline";


// Simplified layout for demo
interface SidebarNewProps {
  // activeSection: string; // Unused
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const SidebarNew: React.FC<SidebarNewProps> = ({
  // activeSection,
  isCollapsed,
  onToggleCollapse,
}) => {
  // Simply hardcoded items for the demo
  const demoItems = [
    { path: "/tables-charts/billing-calculation", label: "Display Page" }, // Billing Calculation
    { path: "/pricing-scheme", label: "Settings Page" }, // Pricing Scheme
  ];

  return (
    <aside
      className={`bg-white shadow-sm border-r border-gray-200 min-h-[calc(100vh-80px)] transition-all duration-300 ${
        isCollapsed ? "w-12" : "w-64"
      }`}
    >
      <div className="p-4">
        {!isCollapsed ? (
          <>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Menu
            </h2>
            <ul className="space-y-2">
              {demoItems.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `block px-4 py-2 rounded-lg transition-colors ${
                        isActive
                          ? "bg-blue-50 text-blue-700 font-medium"
                          : "text-gray-700 hover:bg-gray-50"
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <div className="flex justify-center">
            <button
              onClick={onToggleCollapse}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="Expand menu"
            >
              <ChevronRightIcon className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
