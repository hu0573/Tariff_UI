import { useState, useEffect, useMemo } from 'react';
import { NMISelector } from '@/pages/TablesCharts/shared/components/NMISelector';
import { docTemplatesApi, type QuickToolVariableItem } from '@/api/docTemplates';
import { useNMIList, useRefreshStrategy } from '@/hooks/useConfig';
import { Loading } from '@/components/common/Loading';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { Badge } from '@/components/common/Badge';
import { 
  ClipboardDocumentIcon, 
  CheckIcon, 
  MagnifyingGlassIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { toastManager } from '@/components/common/Toast';

interface VariableQuickToolProps {
  initialNmi?: string;
}

export const VariableQuickTool: React.FC<VariableQuickToolProps> = ({ initialNmi = '' }) => {
  const { data: nmiListData, isLoading: isNmiListLoading } = useNMIList();
  const { data: refreshStrategy } = useRefreshStrategy();
  const [selectedNmi, setSelectedNmi] = useState(initialNmi);
  const [variables, setVariables] = useState<QuickToolVariableItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Default NMI selection from list if none provided
  useEffect(() => {
    if (!selectedNmi && (nmiListData?.nmis?.length ?? 0) > 0) {
      // Prefer monitored NMIs
      const monitoredNMIs = (nmiListData?.nmis || []).filter((item: any) => {
        if (!refreshStrategy?.monitored_nmis) return true;
        const set = new Set(refreshStrategy.monitored_nmis.map((m: any) => 
          typeof m === 'string' ? m : m.nmi || String(m)
        ));
        return set.has(item.nmi);
      });
      
      const defaultNmi = monitoredNMIs.length > 0 ? monitoredNMIs[0].nmi : (nmiListData?.nmis?.[0]?.nmi);
      if (defaultNmi) {
          setSelectedNmi(defaultNmi);
      }
    }
  }, [nmiListData, refreshStrategy, selectedNmi]);

  // Fetch variables when NMI changes
  useEffect(() => {
    if (selectedNmi) {
      loadVariables(selectedNmi);
    } else {
      setVariables([]);
    }
  }, [selectedNmi]);

  const loadVariables = async (nmi: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await docTemplatesApi.getQuickToolVariablePreviews(nmi);
      setVariables(response.variables);
    } catch (err: any) {
      setError(err.message || 'Failed to load variables');
      setVariables([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    toastManager.success('Copied to clipboard!');
    setTimeout(() => setCopiedText(null), 2000);
  };

  const filteredVariables = useMemo(() => {
    if (!searchTerm) return variables;
    const lowerTerm = searchTerm.toLowerCase();
    return variables.filter(v => 
      v.field.toLowerCase().includes(lowerTerm) || 
      v.value.toLowerCase().includes(lowerTerm) ||
      v.category.toLowerCase().includes(lowerTerm)
    );
  }, [variables, searchTerm]);

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'user_information':
        return <Badge variant="success">user_information</Badge>;
      case 'special_field':
        return <Badge variant="info">special_field</Badge>;
      default:
        return <Badge>{category}</Badge>;
    }
  };

  return (
    <div className="space-y-4 min-h-[500px] flex flex-col">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
        <div className="w-full">
          <NMISelector 
            value={selectedNmi} 
            onChange={setSelectedNmi} 
            label="1. Select NMI"
          />
        </div>
        <div className="w-full">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            2. Search Variables
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Search by field name (e.g. date_SA) or value..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setSearchTerm('')}
              >
                <XMarkIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden border border-gray-200 rounded-lg flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[15%]">
                  Category
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[20%]">
                  Field
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[50%]">
                  Preview Value
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-[15%]">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 overflow-y-auto">
              {isLoading || isNmiListLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center">
                    <Loading size="md" />
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-red-500">
                    <ErrorMessage message={error} />
                  </td>
                </tr>
              ) : !selectedNmi ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-gray-500 italic">
                    Please select an NMI to see variable previews
                  </td>
                </tr>
              ) : filteredVariables.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-gray-500">
                    No variables found
                  </td>
                </tr>
              ) : (
                filteredVariables.map((variable) => (
                  <tr key={`${variable.category}-${variable.field}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getCategoryBadge(variable.category)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono text-sm font-semibold text-gray-900">
                        {variable.field}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600 break-all" title={variable.value}>
                        {variable.value || <span className="text-gray-400 italic">empty</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleCopy(variable.copy_text)}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                      >
                        {copiedText === variable.copy_text ? (
                          <>
                            <CheckIcon className="h-4 w-4 mr-1" />
                            Copied
                          </>
                        ) : (
                          <>
                            <ClipboardDocumentIcon className="h-4 w-4 mr-1" />
                            Copy Tag
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-md flex items-start gap-2">
        <span className="font-bold text-blue-700">Tips:</span>
        <p>
          Clicking "Copy Tag" will copy the variable in the format of <code className="bg-blue-100 px-1 rounded">{"{{field_name@category_name}}"}</code>.
          You can paste this directly into your template document.
        </p>
      </div>
    </div>
  );
};
