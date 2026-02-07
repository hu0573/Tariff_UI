import { useState } from 'react'
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react'
import { Settings2, Calculator, BarChart3 } from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const tabs = [
  { id: 'settings', name: 'Billing Settings', icon: Settings2 },
  { id: 'calculation', name: 'Billing Calculation', icon: Calculator },
]

export default function App() {
  const [selectedIndex, setSelectedIndex] = useState(0)

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 p-1.5 rounded-lg shadow-sm">
                <BarChart3 className="text-white" size={20} />
              </div>
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent">
                Tariff UI Demo
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                Standalone Version
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <TabGroup selectedIndex={selectedIndex} onChange={setSelectedIndex}>
          <div className="mb-8">
            <TabList className="flex space-x-1 rounded-xl bg-slate-200/50 p-1 max-w-md border border-slate-200">
              {tabs.map((tab) => (
                <Tab
                  key={tab.id}
                  className={({ selected }) =>
                    cn(
                      'w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all duration-200 outline-none flex items-center justify-center gap-2',
                      selected
                        ? 'bg-white text-blue-700 shadow-sm'
                        : 'text-slate-600 hover:bg-white/50 hover:text-slate-900'
                    )
                  }
                >
                  <tab.icon size={18} />
                  {tab.name}
                </Tab>
              ))}
            </TabList>
          </div>

          <TabPanels className="focus:outline-none">
            {tabs.map((tab) => (
              <TabPanel
                key={tab.id}
                className="focus:outline-none animate-in fade-in slide-in-from-bottom-2 duration-500"
              >
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[600px] flex items-center justify-center text-slate-400">
                  <div className="text-center">
                    <tab.icon size={48} className="mx-auto mb-4 opacity-20" />
                    <p>Content for {tab.name} will be migrated here...</p>
                  </div>
                </div>
              </TabPanel>
            ))}
          </TabPanels>
        </TabGroup>
      </main>

      {/* Footer */}
      <footer className="mt-auto py-12 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-slate-400 text-sm">
          <p>© 2026 Tariff UI Demo • Pure Frontend Re-implementation</p>
        </div>
      </footer>
    </div>
  )
}
