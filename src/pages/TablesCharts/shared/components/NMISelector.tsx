import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useNMIList, useRefreshStrategy } from '@/hooks/useConfig';
import { Loading } from '@/components/common/Loading';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { type NMIItem } from '@/components/NMISelector';
import { MagnifyingGlassIcon, ChevronUpDownIcon, CheckIcon } from '@heroicons/react/24/outline'; // Using 24/outline to match Sidebar style, though 20/solid is also common for inputs

export interface NMISelectorProps {
  value: string;
  onChange: (nmi: string) => void;
  label?: string;
  filterByMonitored?: boolean;
}

export const NMISelector: React.FC<NMISelectorProps> = ({
  value,
  onChange,
  label = 'Selected NMI',
  filterByMonitored = true,
}) => {
  const { data: nmiListData, isLoading: isListLoading, error: listError } = useNMIList();
  const { data: refreshStrategy } = useRefreshStrategy();

  // State
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input on open
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Data Processing
  const monitoredNMIMap = useMemo(() => {
     if (!refreshStrategy?.monitored_nmis) return new Set<string>();
     const set = new Set<string>();
     refreshStrategy.monitored_nmis.forEach((item: any) => {
         const nmi = typeof item === "string" ? item : item.nmi || String(item);
         set.add(nmi);
     });
     return set;
  }, [refreshStrategy]);

  const nmis = useMemo(() => {
    const allNMIs: NMIItem[] = (nmiListData as any)?.nmis || [];
    // Always start with all NMIs or filtered by monitored, ignoring search term for this base list
    let baseList = allNMIs;
    
    if (filterByMonitored) {
        baseList = allNMIs.filter((nmi: NMIItem) => monitoredNMIMap.has(nmi.nmi));
    }
    
    return baseList.sort((a, b) => a.nmi.localeCompare(b.nmi));
  }, [nmiListData, monitoredNMIMap, filterByMonitored]);

  // NMI Formatter: 20010003744 -> 2001000374-(4)
  const formatNMI = (nmi: string) => {
    if (!nmi || nmi.length < 11) return nmi;
    return `${nmi.substring(0, 10)}-(${nmi.substring(10)})`;
  };

  // Filter Logic
  const filteredNMIs = useMemo(() => {
    if (!searchTerm) return nmis;
    
    const lowerTerm = searchTerm.toLowerCase();
    return nmis.filter(item => {
      const formatted = formatNMI(item.nmi);
      const searchContent = [
        item.nmi,
        formatted,
        item.name,
        item.description,
        item.address,
        item.suburb,
        item.state
      ].map(s => s?.toLowerCase() || '');

      return searchContent.some(s => s.includes(lowerTerm));
    });
  }, [nmis, searchTerm]);

  // Selected Item Info
  const selectedItem = useMemo(() => nmis.find(n => n.nmi === value), [nmis, value]);

  if (isListLoading) {
     return (
         <div className="flex items-center gap-2 py-2">
             <Loading size="sm" />
             <span className="text-sm text-gray-500">Loading NMIs...</span>
         </div>
     );
  }

  if (listError) {
      return <ErrorMessage message="Failed to load NMIs" />;
  }

  return (
    <div className="flex flex-col gap-1 w-full" ref={containerRef}>
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      
      <div className="relative mt-1">
        {/* Trigger Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="relative w-full cursor-default rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
          disabled={nmis.length === 0}
        >
          <span className="block truncate">
            {selectedItem ? formatNMI(selectedItem.nmi) : (nmis.length === 0 ? "No NMIs found" : "Select NMI")}
          </span>
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
            <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </span>
        </button>

        {/* Dropdown Panel */}
        {isOpen && (
          <div className="absolute z-50 mt-1 max-h-96 w-[200%] min-w-[600px] overflow-hidden rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
            {/* Search Box */}
            <div className="sticky top-0 z-10 bg-white px-3 py-2 border-b border-gray-100">
               <div className="relative">
                 <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2">
                    <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
                 </div>
                 <input
                    ref={searchInputRef}
                    type="text"
                    className="block w-full rounded-md border-0 py-1.5 pl-8 pr-2 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                    placeholder="Search NMI, Address, Name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                 />
               </div>
            </div>

            {/* List */}
            <ul className="max-h-80 overflow-auto py-1" role="listbox">
               {filteredNMIs.length === 0 ? (
                  <li className="relative cursor-default select-none py-2 pl-3 pr-9 text-gray-500 px-4">
                     No matching NMIs found
                  </li>
               ) : (
                 filteredNMIs.map((item) => {
                    const isSelected = item.nmi === value;
                    return (
                        <li
                            key={item.nmi}
                            className={`relative cursor-default select-none py-2 pl-3 pr-9 group hover:bg-blue-50 ${isSelected ? 'bg-blue-50' : ''}`}
                            role="option"
                            aria-selected={isSelected}
                            onClick={() => {
                                onChange(item.nmi);
                                setIsOpen(false);
                                setSearchTerm(''); // Optional: clear search on select
                            }}
                        >
                            <div className="flex flex-col gap-0.5">
                                {/* First Line: NMI (formatted) | Description | Name */}
                                <div className="flex items-center gap-2 overflow-hidden">
                                     <span className={`font-mono font-medium whitespace-nowrap ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                                         {formatNMI(item.nmi)}
                                     </span>
                                     {item.description && (
                                         <>
                                            <span className="text-gray-300">|</span>
                                            <span className="truncate text-gray-700 font-medium">{item.description}</span>
                                         </>
                                     )}
                                     {item.name && (
                                         <>
                                            <span className="text-gray-300">|</span>
                                            <span className="truncate text-gray-500">{item.name}</span>
                                         </>
                                     )}
                                </div>
                                
                                {/* Second Line: Address */}
                                <div className="text-xs text-gray-500 truncate">
                                    {[item.address, item.suburb, item.state, item.postcode].filter(Boolean).join(', ')}
                                </div>
                            </div>

                            {/* Check Icon for Selected */}
                            {isSelected && (
                                <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-blue-600">
                                    <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                </span>
                            )}
                        </li>
                    );
                 })
               )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
