import React, { createContext, useContext } from 'react';

interface TabsContextType {
  activeIndex: number;
  setActiveIndex: (index: number) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

interface TabsProps {
  value: number;
  onChange: (value: number) => void;
  children: React.ReactNode;
}

export const Tabs: React.FC<TabsProps> = ({ value, onChange, children }) => {
  return (
    <TabsContext.Provider value={{ activeIndex: value, setActiveIndex: onChange }}>
      <div className="w-full">{children}</div>
    </TabsContext.Provider>
  );
};

interface TabListProps {
  children: React.ReactNode;
}

export const TabList: React.FC<TabListProps> = ({ children }) => {
  return (
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex space-x-8" aria-label="Tabs">
        {children}
      </nav>
    </div>
  );
};

interface TabProps {
  children: React.ReactNode;
  index?: number;
}

export const Tab: React.FC<TabProps> = ({ children, index = 0 }) => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tab must be used within Tabs');
  }

  const { activeIndex, setActiveIndex } = context;
  const isActive = activeIndex === index;

  return (
    <button
      onClick={() => setActiveIndex(index)}
      className={`
        whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
        ${
          isActive
            ? 'border-blue-500 text-blue-600'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
        }
      `}
    >
      {children}
    </button>
  );
};

interface TabPanelsProps {
  children: React.ReactNode;
}

export const TabPanels: React.FC<TabPanelsProps> = ({ children }) => {
  return <div className="mt-6">{children}</div>;
};

interface TabPanelProps {
  children: React.ReactNode;
  index?: number;
}

export const TabPanel: React.FC<TabPanelProps> = ({ children, index = 0 }) => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('TabPanel must be used within Tabs');
  }

  const { activeIndex } = context;
  if (activeIndex !== index) {
    return null;
  }

  return <div>{children}</div>;
};
