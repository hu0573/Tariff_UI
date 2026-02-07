// Variable configuration component
import { useState, useEffect, useCallback } from 'react';
import { docTemplatesApi } from '@/api/docTemplates';
import { timeApi } from '@/api/time';
import type { TemplateDetail, VariableMapping, FieldInfo, SpecialFieldInfo, VariablePreviewItem } from '@/api/docTemplates';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Loading } from '@/components/common/Loading';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { LockClosedIcon, ExclamationTriangleIcon, ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/solid';

interface VariableConfigurationProps {
  template: TemplateDetail | null;
  selectedNMI?: string;
  onMappingUpdated?: () => void;
  onMappingCompletenessChange?: (isComplete: boolean) => void;
}

interface VariableConfigState {
  mapping_type: 'special_field' | 'user_information' | 'chart' | 'custom_text' | '';
  source_field?: string;
  source_type?: string;
  source_field_name?: string;
  config_json?: Record<string, any>;
  config_json_string?: string;
  custom_text?: string;
  state?: string;
  is_explicit_link?: boolean;
  is_valid?: boolean;
}

export const VariableConfiguration: React.FC<VariableConfigurationProps> = ({
  template,
  selectedNMI,
  onMappingUpdated,
  onMappingCompletenessChange,
}) => {
  const [availableFields, setAvailableFields] = useState<FieldInfo[]>([]);
  const [specialFields, setSpecialFields] = useState<SpecialFieldInfo[]>([]);
  const [loadingFields, setLoadingFields] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [previewValues, setPreviewValues] = useState<Record<string, VariablePreviewItem>>({});
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [availableStates, setAvailableStates] = useState<string[]>([]);
  const [collapsedVariables, setCollapsedVariables] = useState<Record<string, boolean>>({});

  // Variable configurations state
  const [variableConfigs, setVariableConfigs] = useState<Record<string, VariableConfigState>>({});

  // Load available fields and special fields
  useEffect(() => {
    const loadFields = async () => {
      if (!template) return;

      setLoadingFields(true);
      setError(null);

      try {
        const [fieldsResponse, specialFieldsResponse] = await Promise.all([
          docTemplatesApi.getAvailableFields('nmi_meters'),
          docTemplatesApi.getSpecialFields(),
        ]);

        setAvailableFields(fieldsResponse.fields);
        setSpecialFields(specialFieldsResponse.fields);
      } catch (err: any) {
        setError(err.response?.data?.error?.message || err.message || 'Failed to load fields');
      } finally {
        setLoadingFields(false);
      }
    };

    loadFields();
    
    // Load states for special field timezone selection
    const loadStates = async () => {
      try {
        const response = await timeApi.getStates();
        setAvailableStates(response.states);
      } catch (err) {
        console.error('Failed to load states:', err);
      }
    };
    loadStates();
  }, [template]);

  // Check if all variables are configured
  const checkMappingCompleteness = useCallback((configs: Record<string, VariableConfigState>, templateVars: Array<{ name: string }>): boolean => {
    if (!templateVars || templateVars.length === 0) return true;
    
    return templateVars.every((variable) => {
      const config = configs[variable.name];
      if (!config || !config.mapping_type) return false;
      
      if (config.mapping_type === 'special_field') {
        return !!config.source_field;
      } else if (config.mapping_type === 'user_information') {
        // source_type is automatically set to 'nmi_meters', only check field
        return !!config.source_field_name;
      } else if (config.mapping_type === 'chart') {
        return !!config.config_json_string;
      } else if (config.mapping_type === 'custom_text') {
        return !!config.custom_text;
      }
      return false;
    });
  }, []);

  // Initialize variable configs from template
  useEffect(() => {
    if (!template) {
      setVariableConfigs({});
      if (onMappingCompletenessChange) {
        onMappingCompletenessChange(true);
      }
      return;
    }

    const configs: Record<string, VariableConfigState> = {};
    template.variables.forEach((variable) => {
      const mapping = variable.mapping as VariableConfigState | undefined;
      if (mapping) {
        configs[variable.name] = {
          mapping_type: mapping.mapping_type || '',
          source_field: mapping.source_field,
          source_type: mapping.source_type || (mapping.mapping_type === 'user_information' ? 'nmi_meters' : undefined),
          source_field_name: mapping.source_field,
          config_json: mapping.config_json,
          config_json_string: mapping.config_json ? JSON.stringify(mapping.config_json, null, 2) : '',
          custom_text: mapping.custom_text,
          state: mapping.state,
          is_explicit_link: mapping.is_explicit_link,
          is_valid: mapping.is_valid,
        };
      } else {
        configs[variable.name] = {
          mapping_type: '',
        };
      }
    });

    setVariableConfigs(configs);
    
    // Check completeness
    if (onMappingCompletenessChange) {
      const isComplete = checkMappingCompleteness(configs, template.variables);
      onMappingCompletenessChange(isComplete);
    }

    // Default collapse strategy: collapse everything that is configured and valid
    const initialCollapsed: Record<string, boolean> = {};
    template.variables.forEach((variable) => {
      const mapping = variable.mapping as any | undefined;
      // Collapse if it has a mapping AND (if it's an explicit link, it must be valid)
      const hasValidMapping = !!mapping && (mapping.is_explicit_link ? mapping.is_valid !== false : true);
      
      if (hasValidMapping) {
        initialCollapsed[variable.name] = true;
      } else {
        initialCollapsed[variable.name] = false;
      }
    });
    setCollapsedVariables(initialCollapsed);
  }, [template, checkMappingCompleteness, onMappingCompletenessChange]);

  // Update completeness when configs change
  useEffect(() => {
    if (!template || !onMappingCompletenessChange) return;
    const isComplete = checkMappingCompleteness(variableConfigs, template.variables);
    onMappingCompletenessChange(isComplete);
  }, [variableConfigs, template, checkMappingCompleteness, onMappingCompletenessChange]);

  // Load preview values when mappings or NMI change
  const loadPreviewValues = useCallback(async () => {
    if (!template || !selectedNMI) {
      setPreviewValues({});
      return;
    }

    // Build mappings from current configs
    const mappings: Record<string, VariableMapping> = {};
    for (const [variableName, config] of Object.entries(variableConfigs)) {
      if (!config.mapping_type) continue;

      const mapping: VariableMapping = {
        mapping_type: config.mapping_type as 'special_field' | 'user_information' | 'chart' | 'custom_text',
      };

      if (config.mapping_type === 'special_field') {
        if (!config.source_field) continue;
        mapping.source_field = config.source_field;
      } else if (config.mapping_type === 'user_information') {
        if (!config.source_field_name) continue;
        mapping.source_type = 'nmi_meters';
        mapping.source_field = config.source_field_name;
      } else if (config.mapping_type === 'chart') {
        if (!config.config_json_string) continue;
        try {
          mapping.config_json = JSON.parse(config.config_json_string);
        } catch (e) {
          // Invalid JSON, skip preview for this variable
          continue;
        }
      } else if (config.mapping_type === 'custom_text') {
        if (!config.custom_text) continue;
        mapping.custom_text = config.custom_text;
      }

      if (config.state) {
        mapping.state = config.state;
      }

      mappings[variableName] = mapping;
    }

    // Only load preview if there are configured mappings
    if (Object.keys(mappings).length === 0) {
      setPreviewValues({});
      return;
    }

    setLoadingPreview(true);
    try {
      const previewResponse = await docTemplatesApi.previewVariableValues(
        template.id,
        selectedNMI,
        mappings
      );

      // Convert array to map for easy lookup
      const previewMap: Record<string, VariablePreviewItem> = {};
      previewResponse.variables.forEach((item) => {
        previewMap[item.variable_name] = item;
      });
      setPreviewValues(previewMap);
    } catch (err: any) {
      // Silently fail preview - don't show error to user
      console.error('Failed to load preview values:', err);
      setPreviewValues({});
    } finally {
      setLoadingPreview(false);
    }
  }, [template, selectedNMI, variableConfigs]);

  // Debounce preview loading to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      loadPreviewValues();
    }, 500); // Wait 500ms after last change

    return () => clearTimeout(timer);
  }, [loadPreviewValues]);

  const updateVariableConfig = (variableName: string, updates: Partial<VariableConfigState>) => {
    setVariableConfigs((prev) => ({
      ...prev,
      [variableName]: {
        ...prev[variableName],
        ...updates,
      },
    }));
  };

  const handleBatchSave = async () => {
    if (!template) return;

    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const mappings: Record<string, VariableMapping> = {};

      for (const [variableName, config] of Object.entries(variableConfigs)) {
        if (!config.mapping_type) continue;

        const mapping: VariableMapping = {
          mapping_type: config.mapping_type as 'special_field' | 'user_information' | 'chart' | 'custom_text',
        };

        if (config.mapping_type === 'special_field') {
          if (!config.source_field) continue;
          mapping.source_field = config.source_field;
        } else if (config.mapping_type === 'user_information') {
          if (!config.source_field_name) continue;
          // source_type is automatically set to 'nmi_meters' for user_information
          mapping.source_type = 'nmi_meters';
          mapping.source_field = config.source_field_name;
        } else if (config.mapping_type === 'chart') {
          if (!config.config_json_string) continue;
          try {
            mapping.config_json = JSON.parse(config.config_json_string);
          } catch (e) {
            setError(`Invalid JSON configuration for ${variableName}`);
            setSaving(false);
            return;
          }
        } else if (config.mapping_type === 'custom_text') {
          if (!config.custom_text) continue;
          mapping.custom_text = config.custom_text;
        }

        if (config.state) {
          mapping.state = config.state;
        }

        mappings[variableName] = mapping;
      }

      if (Object.keys(mappings).length === 0) {
        setError('No valid mappings to save');
        setSaving(false);
        return;
      }

      await docTemplatesApi.batchUpdateMappings(template.id, mappings);
      setSuccessMessage('All mappings saved successfully');
      
      // Refresh template detail immediately to update UI
      if (onMappingUpdated) {
        // Call immediately, then again after a short delay to ensure state is updated
        onMappingUpdated();
        setTimeout(() => {
          onMappingUpdated();
          // Update completeness after template is refreshed
          if (onMappingCompletenessChange && template) {
            const isComplete = checkMappingCompleteness(variableConfigs, template.variables);
            onMappingCompletenessChange(isComplete);
          }
        }, 600);
      } else {
        // If no onMappingUpdated, check completeness immediately
        if (onMappingCompletenessChange && template) {
          const isComplete = checkMappingCompleteness(variableConfigs, template.variables);
          onMappingCompletenessChange(isComplete);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to save mappings');
    } finally {
      setSaving(false);
    }
  };

  if (!template) {
    return (
      <div className="text-center py-8 text-gray-500">
        Select a template to configure variables
      </div>
    );
  }

  if (template.variables.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No variables found in this template
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && <ErrorMessage message={error} />}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded">
          {successMessage}
        </div>
      )}

      {loadingFields && <Loading />}

      <div className="mb-4">
        <div className="text-sm text-gray-600">
          Configure mappings for {template.variables.length} variable(s)
        </div>
      </div>

      <div className="space-y-4">
        {template.variables.map((variable, index) => {
          const config = variableConfigs[variable.name] || { mapping_type: '' };
          const isCollapsed = collapsedVariables[variable.name];
          const hasMapping = !!variable.mapping;
          const isExplicit = !!config.is_explicit_link;
          const isValid = config.is_valid !== false;
          
          const toggleCollapse = () => {
             setCollapsedVariables(prev => ({ ...prev, [variable.name]: !prev[variable.name] }));
          };

          const previewItem = previewValues[variable.name];

          return (
            <Card 
              key={index} 
              className={`${!isValid ? 'border-orange-200' : ''}`}
              title={
                <div 
                  className="flex items-center justify-between cursor-pointer group"
                  onClick={toggleCollapse}
                >
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isCollapsed ? <ChevronRightIcon className="h-4 w-4 text-gray-400" /> : <ChevronDownIcon className="h-4 w-4 text-gray-400" />}
                    <span className="font-mono text-sm">
                      {`{{${variable.name}}}`}
                    </span>
                    {isExplicit && (
                      <div className="flex items-center gap-1 ml-2" title="This variable is explicitly linked in the Word template.">
                        <LockClosedIcon className="h-4 w-4 text-blue-500" />
                        {!isValid && (
                          <div className="flex items-center gap-1 text-orange-500" title="Invalid explicit mapping: system cannot find this field or category.">
                            <ExclamationTriangleIcon className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {isCollapsed && (
                    <div className="flex items-center gap-4 text-sm font-normal text-gray-500 overflow-hidden flex-1 px-4">
                      <div className="flex-1 min-w-0">
                        {previewItem && !previewItem.error ? (
                          <span className="truncate block" title={previewItem.preview_value}>
                            Preview: {previewItem.preview_value || '[Empty]'}
                          </span>
                        ) : (
                          <span className="truncate block">
                            Mapping: {config.mapping_type || 'None'}
                          </span>
                        )}
                      </div>
                      {hasMapping && <Badge variant="success" className="flex-shrink-0">Configured</Badge>}
                    </div>
                  )}
                </div>
              }
            >
              {!isCollapsed && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                      {`{{${variable.name}}}`}
                    </code>
                    {hasMapping && (
                      <Badge variant="success">Configured</Badge>
                    )}
                    {!hasMapping && (
                      <Badge variant="warning">Not configured</Badge>
                    )}
                    {isExplicit && (
                      <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded flex items-center gap-1 border border-blue-100">
                        <LockClosedIcon className="h-3 w-3" />
                        Explicitly Linked
                      </span>
                    )}
                  </div>

                  {isExplicit && !isValid && (
                    <div className="bg-orange-50 border border-orange-200 text-orange-800 px-3 py-2 rounded text-sm flex items-start gap-2">
                      <ExclamationTriangleIcon className="h-5 w-5 text-orange-500 flex-shrink-0" />
                      <div>
                        <strong>Warning: Invalid Syntax</strong>
                        <p>The field or category specified in <code>{`{{${variable.name}}}`}</code> does not exist in the system. Please check your Word template.</p>
                      </div>
                    </div>
                  )}

                  {/* Mapping Type Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mapping Type
                    </label>
                    <select
                      value={config.mapping_type}
                      disabled={isExplicit}
                      onChange={(e) => {
                        const newType = e.target.value as VariableConfigState['mapping_type'];
                        const updates: Partial<VariableConfigState> = {
                          mapping_type: newType,
                          source_field: undefined,
                          source_type: undefined,
                          source_field_name: undefined,
                          config_json: undefined,
                          config_json_string: undefined,
                          custom_text: undefined,
                        };
                        // Auto-set source_type for user_information
                        if (newType === 'user_information') {
                          updates.source_type = 'nmi_meters';
                        }
                        updateVariableConfig(variable.name, updates);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                    >
                      <option value="">Select mapping type...</option>
                      <option value="special_field">special_field</option>
                      <option value="user_information">user_information</option>
                      <option value="chart">chart</option>
                      <option value="custom_text">custom_text</option>
                    </select>
                  </div>

                  {/* Special Field Configuration */}
                  {config.mapping_type === 'special_field' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        special_field
                      </label>
                      <select
                        value={config.source_field || ''}
                        disabled={isExplicit}
                        onChange={(e) => updateVariableConfig(variable.name, { source_field: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                      >
                        <option value="">Select special_field...</option>
                        {specialFields.map((field) => (
                          <option key={field.name} value={field.name}>
                            {field.name} - {field.description}
                          </option>
                        ))}
                      </select>

                      {/* Timezone selection for last_full_month */}
                      {config.source_field === 'last_full_month' && (
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Timezone/State
                          </label>
                          <select
                            value={config.state || ''}
                            onChange={(e) => updateVariableConfig(variable.name, { state: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select state...</option>
                            {availableStates.map((state) => (
                              <option key={state} value={state}>
                                {state}
                              </option>
                            ))}
                          </select>
                          <p className="text-xs text-gray-500 mt-1">
                            Select the state to determine the natural month dates correctly.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* User Information Configuration */}
                  {config.mapping_type === 'user_information' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Field
                      </label>
                      <select
                        value={config.source_field_name || ''}
                        disabled={isExplicit}
                        onChange={(e) => {
                          updateVariableConfig(variable.name, { 
                            source_field_name: e.target.value,
                            source_type: 'nmi_meters', // Automatically set table to nmi_meters
                          });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                      >
                        <option value="">Select field...</option>
                        {availableFields.map((field) => (
                          <option key={field.name} value={field.name}>
                            {field.name} ({field.type})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Chart Configuration */}
                  {config.mapping_type === 'chart' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Chart Configuration (JSON)
                      </label>
                      <textarea
                        value={config.config_json_string || ''}
                        onChange={(e) => updateVariableConfig(variable.name, { config_json_string: e.target.value })}
                        placeholder='{"chart_type": "spot_price_graphs", "chart_name": "Spot Price Graphs", "config": {...}}'
                        rows={8}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Paste the JSON configuration from Spot Price Graphs page
                      </p>
                    </div>
                  )}

                  {/* Custom Text Configuration */}
                  {config.mapping_type === 'custom_text' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                         Text Content
                      </label>
                      <textarea
                        value={config.custom_text || ''}
                        onChange={(e) => updateVariableConfig(variable.name, { custom_text: e.target.value })}
                        placeholder="Enter custom text..."
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}

                  {/* Preview Value Display */}
                  {selectedNMI && (config.mapping_type || variable.mapping) && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-start gap-2">
                        <span className="text-sm font-medium text-gray-700 min-w-[80px]">
                          Preview:
                        </span>
                        <div className="flex-1">
                          {loadingPreview ? (
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Loading className="w-4 h-4" />
                              <span>Loading preview...</span>
                            </div>
                          ) : (
                            <div className="text-sm">
                              {previewItem ? (
                                <div>
                                  <div className={`font-mono bg-gray-50 px-3 py-2 rounded border ${
                                    previewItem.error
                                      ? 'border-red-200 bg-red-50'
                                      : 'border-gray-200'
                                  }`}>
                                    {previewItem.error ? (
                                      <span className="text-red-600">
                                        Error: {previewItem.error}
                                      </span>
                                    ) : (
                                      <span className="text-gray-800">
                                        {previewItem.preview_value || '[Empty]'}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div className="text-gray-400 italic">
                                  Preview not available
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
        <Button
          onClick={handleBatchSave}
          disabled={saving}
          variant="primary"
          size="lg"
        >
          {saving ? 'Saving...' : 'Save All Mappings'}
        </Button>
      </div>
    </div>
  );
};
