// NMI Selector Component
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Loading } from '@/components/common/Loading';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { MagnifyingGlassIcon, ChevronUpDownIcon, CheckIcon } from '@heroicons/react/24/outline';

export interface NMIItem {
  nmi: string;
  name?: string;
  description?: string;
  address?: string;
  suburb?: string;
  state?: string;
  postcode?: string;
  refreshFrequency?: string; // e.g., 'daily', 'weekly', 'monthly'
}

interface NMISelectorProps {
  nmis: NMIItem[];
  value?: string;
  onChange: (nmi: string) => void;
  isLoading?: boolean;
  showInfo?: boolean; // Whether to show selected NMI information
}

export const NMISelector: React.FC<NMISelectorProps> = ({
  nmis,
  value,
  onChange,
  isLoading = false,
  showInfo = true,
}) => {
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

  // Selected NMI details
  const selectedNMI = useMemo(() => {
    if (!value) return null;
    return nmis.find((item) => item.nmi === value) || null;
  }, [value, nmis]);

  // Handle empty list (but not loading)
  if (!isLoading && nmis.length === 0) {
    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select NMI
        </label>
        <ErrorMessage
          message="No NMIs available. Please refresh the list."
          className="mt-2"
        />
      </div>
    );
  }

  return (
    <div className="mb-4" ref={containerRef}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Select NMI
      </label>
      
      {isLoading ? (
        <div className="py-2 flex items-center gap-2">
          <Loading size="sm" />
          <p className="text-gray-500 text-sm">Loading NMI list...</p>
        </div>
      ) : (
        <div className="relative">
             {/* Trigger Button */}
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="relative w-full cursor-default rounded-lg border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              <span className="block truncate">
                {selectedNMI ? formatNMI(selectedNMI.nmi) : "-- Select NMI --"}
              </span>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </span>
            </button>

            {/* Dropdown Panel */}
            {isOpen && (
              <div className="absolute z-50 mt-1 max-h-96 w-[200%] min-w-[600px] overflow-hidden rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                <div className="sticky top-0 z-10 bg-white px-3 py-2 border-b border-gray-100">
                    <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2">
                            <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
                        </div>
                        <input
                            ref={searchInputRef}
                            type="text"
                            className="block w-full rounded-md border-0 py-1.5 pl-8 pr-2 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

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
                                        setSearchTerm('');
                                    }}
                                >
                                    <div className="flex flex-col gap-0.5">
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
                                        <div className="text-xs text-gray-500 truncate">
                                            {[item.address, item.suburb, item.state, item.postcode].filter(Boolean).join(', ')}
                                        </div>
                                    </div>
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
      )}
      
      {/* Display selected NMI information (Keep existing functionality) */}
      {showInfo && selectedNMI && (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Selected NMI Information</h4>
          <div className="space-y-1 text-sm text-gray-700">
            <div>
              <span className="font-medium">NMI:</span> {formatNMI(selectedNMI.nmi)}
            </div>
            {selectedNMI.name && (
              <div>
                <span className="font-medium">Name:</span> {selectedNMI.name}
              </div>
            )}
            {selectedNMI.description && (
              <div>
                <span className="font-medium">Description:</span> {selectedNMI.description}
              </div>
            )}
            {selectedNMI.address && (
              <div>
                <span className="font-medium">Address:</span> {selectedNMI.address}
              </div>
            )}
            {(selectedNMI.suburb || selectedNMI.state || selectedNMI.postcode) && (
              <div>
                <span className="font-medium">Location:</span>{' '}
                {[
                  selectedNMI.suburb,
                  selectedNMI.state,
                  selectedNMI.postcode,
                ]
                  .filter(Boolean)
                  .join(', ')}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Re-export type for better module resolution

