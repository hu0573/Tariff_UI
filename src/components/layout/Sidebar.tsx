// Navigation sidebar component
import React from 'react';
import { NavLink } from 'react-router-dom';

interface NavItem {
  path: string;
  label: string;
  icon?: React.ReactNode;
}

const navItems: NavItem[] = [
  { path: '/automation', label: 'Automation Dashboard' },
  { path: '/', label: 'Dashboard' },
  { path: '/execution/history', label: 'Execution History' },
  { path: '/execution/statistics', label: 'Execution Statistics' },
  { path: '/configuration/server', label: 'Server Config' },
  { path: '/configuration/sapn', label: 'SAPN Config' },
  { path: '/configuration/refresh-strategy', label: 'Refresh Strategy' },
  { path: '/data-viewer', label: 'Data Viewer' },
  { path: '/nmi-list', label: 'NMI List' },
  { path: '/spot-price/download-config', label: 'AEMO Download Config' },
  { path: '/spot-price/graphs', label: 'Spot Price Graphs' },
  { path: '/document-template', label: 'Generate Report' },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-white shadow-sm border-r border-gray-200 min-h-[calc(100vh-64px)]">
      <nav className="p-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `block px-4 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`
                }
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};
