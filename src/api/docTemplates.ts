// Document templates API functions
import apiClient from './client';

// Type definitions
export interface TemplateVariable {
  name: string;
  type: string;
  description?: string;
}

export interface TemplateListItem {
  id: string;
  name: string;
  description: string;
  file_name: string;
  file_size: number;
  created_at: string;
  updated_at: string;
  variable_count: number;
}

export interface TemplateDetail {
  id: string;
  name: string;
  description: string;
  file_name: string;
  file_size: number;
  created_at: string;
  updated_at: string;
  variables: Array<{
    name: string;
    type: string;
    description?: string;
    mapping?: Record<string, any>;
  }>;
}

export interface TemplateUploadResponse {
  template_id: string;
  name: string;
  file_name: string;
  file_size: number;
  variables: TemplateVariable[];
  message: string;
}

export interface TemplateListResponse {
  templates: TemplateListItem[];
}

export interface FieldInfo {
  name: string;
  type: string;
  description?: string;
}

export interface AvailableFieldsResponse {
  table: string;
  fields: FieldInfo[];
}

export interface SpecialFieldInfo {
  name: string;
  description: string;
  type: string;
}

export interface SpecialFieldsResponse {
  fields: SpecialFieldInfo[];
}

export interface VariableMapping {
  mapping_type: 'special_field' | 'user_information' | 'chart' | 'custom_text';
  source_field?: string;
  source_type?: string;
  source_field_name?: string;
  config_json?: Record<string, any>;
  custom_text?: string;
  state?: string;
  is_explicit_link?: boolean;
  is_valid?: boolean;
}

export interface BatchMappingUpdateRequest {
  mappings: Record<string, VariableMapping>;
}

export interface AssociatedTemplateDetail {
  id: string;
  name: string;
  description: string;
  updated_at: number;
  associated_at: number;
}

export interface TemplatesByNmiResponse {
  nmi: string;
  templates: AssociatedTemplateDetail[];
}

export interface AssociatedNmiDetail {
  nmi: string;
  name?: string;
  address?: string;
  associated_at: number;
}

export interface TemplateNmiListResponse {
  template_id: string;
  nmis: AssociatedNmiDetail[];
}

export interface AvailableNmiItem {
  nmi: string;
  name?: string;
  address?: string;
  associated_templates: string[];
}

export interface AvailableNmisResponse {
  nmis: AvailableNmiItem[];
  total: number;
}

export interface VariablePreviewItem {
  variable_name: string;
  preview_value: string;
  mapping_type?: string;
  error?: string;
}

export interface VariablePreviewRequest {
  current_nmi: string;
  mappings?: Record<string, VariableMapping>;
}

export interface VariablePreviewResponse {
  template_id: string;
  variables: VariablePreviewItem[];
}

export interface QuickToolVariableItem {
  category: string;
  field: string;
  value: string;
  copy_text: string;
}

export interface QuickToolVariablesResponse {
  variables: QuickToolVariableItem[];
}

export const docTemplatesApi = {
  // Upload template
  uploadTemplate: async (
    file: File,
    name?: string,
    description?: string
  ): Promise<TemplateUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    if (name) formData.append('name', name);
    if (description) formData.append('description', description);

    const response = await apiClient.post<TemplateUploadResponse>(
      '/api/doc-templates/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  // Get template list
  getTemplateList: async (): Promise<TemplateListResponse> => {
    const response = await apiClient.get<TemplateListResponse>(
      '/api/doc-templates'
    );
    return response.data;
  },

  // Get template detail
  getTemplateDetail: async (templateId: string): Promise<TemplateDetail> => {
    const response = await apiClient.get<TemplateDetail>(
      `/api/doc-templates/${templateId}`
    );
    return response.data;
  },

  // Delete template
  deleteTemplate: async (templateId: string): Promise<void> => {
    await apiClient.delete(`/api/doc-templates/${templateId}`);
  },

  // Update template metadata
  updateTemplateMetadata: async (
    templateId: string,
    name?: string,
    description?: string
  ): Promise<TemplateDetail> => {
    const response = await apiClient.patch<TemplateDetail>(
      `/api/doc-templates/${templateId}`,
      {
        name: name,
        description: description,
      }
    );
    return response.data;
  },

  // Get available fields
  getAvailableFields: async (table: string): Promise<AvailableFieldsResponse> => {
    const response = await apiClient.get<AvailableFieldsResponse>(
      `/api/doc-templates/available-fields?table=${encodeURIComponent(table)}`
    );
    return response.data;
  },

  // Get special fields
  getSpecialFields: async (): Promise<SpecialFieldsResponse> => {
    const response = await apiClient.get<SpecialFieldsResponse>(
      '/api/doc-templates/special-fields'
    );
    return response.data;
  },

  // Update variable mapping
  updateVariableMapping: async (
    templateId: string,
    variableName: string,
    mapping: VariableMapping
  ): Promise<{ message: string }> => {
    const response = await apiClient.patch<{ message: string }>(
      `/api/doc-templates/${templateId}/variables/${encodeURIComponent(variableName)}/mapping`,
      mapping
    );
    return response.data;
  },

  // Batch update mappings
  batchUpdateMappings: async (
    templateId: string,
    mappings: Record<string, VariableMapping>
  ): Promise<{ message: string }> => {
    const response = await apiClient.put<{ message: string }>(
      `/api/doc-templates/${templateId}/mappings`,
      { mappings }
    );
    return response.data;
  },

  // Download template file
  downloadTemplate: (templateId: string): string => {
    // Return the download URL
    const baseURL = apiClient.defaults.baseURL || '';
    return `${baseURL}/api/doc-templates/${encodeURIComponent(templateId)}/download`;
  },

  // Preview variable values
  previewVariableValues: async (
    templateId: string,
    currentNmi: string,
    mappings?: Record<string, VariableMapping>
  ): Promise<VariablePreviewResponse> => {
    const response = await apiClient.post<VariablePreviewResponse>(
      `/api/doc-templates/${templateId}/preview`,
      {
        current_nmi: currentNmi,
        mappings: mappings,
      }
    );
    return response.data;
  },

  // List template-associated NMIs
  listTemplateNmis: async (templateId: string): Promise<TemplateNmiListResponse> => {
    const response = await apiClient.get<TemplateNmiListResponse>(
      `/api/doc-templates/${templateId}/nmis`
    );
    return response.data;
  },

  // Get available NMIs for association
  getAvailableNmis: async (params: {
    q?: string;
    exclude_template_id?: string;
    limit?: number;
    offset?: number;
  }): Promise<AvailableNmisResponse> => {
    const response = await apiClient.get<AvailableNmisResponse>(
      '/api/doc-templates/available-nmis',
      { params }
    );
    return response.data;
  },

  // Add template-NMI association
  addTemplateNmi: async (templateId: string, nmi: string): Promise<{ message: string }> => {
    const formData = new FormData();
    formData.append('nmi', nmi);
    const response = await apiClient.post<{ message: string }>(
      `/api/doc-templates/${templateId}/nmis`,
      formData
    );
    return response.data;
  },

  // Batch add template-NMI associations
  batchAddTemplateNmis: async (templateId: string, nmis: string[]): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>(
      `/api/doc-templates/${templateId}/nmis/batch`,
      { nmis }
    );
    return response.data;
  },

  // Remove template-NMI association
  removeTemplateNmi: async (templateId: string, nmi: string): Promise<{ message: string }> => {
    const response = await apiClient.delete<{ message: string }>(
      `/api/doc-templates/${templateId}/nmis/${encodeURIComponent(nmi)}`
    );
    return response.data;
  },

  // Batch remove template-NMI associations
  batchRemoveTemplateNmis: async (templateId: string, nmis: string[]): Promise<{ message: string }> => {
    const response = await apiClient.delete<{ message: string }>(
      `/api/doc-templates/${templateId}/nmis/batch`,
      { data: { nmis } }
    );
    return response.data;
  },

  // Get templates by NMI
  getTemplatesByNmi: async (nmi: string): Promise<TemplatesByNmiResponse> => {
    const response = await apiClient.get<TemplatesByNmiResponse>(
      `/api/doc-templates/by-nmi/${encodeURIComponent(nmi)}`
    );
    return response.data;
  },

  // Get all variable previews for quick tool
  getQuickToolVariablePreviews: async (nmi: string): Promise<QuickToolVariablesResponse> => {
    const response = await apiClient.get<QuickToolVariablesResponse>(
      `/api/doc-templates/quick-tool/variable-previews`,
      { params: { nmi } }
    );
    return response.data;
  },
};

// Re-export all types explicitly for Vite module resolution
