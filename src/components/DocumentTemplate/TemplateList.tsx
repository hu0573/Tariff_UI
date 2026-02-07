// Template list component
import { useState, useEffect } from 'react';
import { Button } from '@/components/common/Button';
import { Loading } from '@/components/common/Loading';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { docTemplatesApi } from '@/api/docTemplates';
import type { TemplateListItem } from '@/api/docTemplates';
import { TemplateEditDialog } from './TemplateEditDialog';

interface TemplateListProps {
  selectedTemplateId?: string;
  onSelectTemplate: (template: TemplateListItem) => void;
  onDeleteTemplate?: (templateId: string) => void;
  refreshTrigger?: number;
  onSwitchToUpload?: () => void;
  onTemplateUpdated?: () => void;
}

export const TemplateList: React.FC<TemplateListProps> = ({
  selectedTemplateId,
  onSelectTemplate,
  onDeleteTemplate,
  refreshTrigger,
  onSwitchToUpload,
  onTemplateUpdated,
}) => {
  const [templates, setTemplates] = useState<TemplateListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<TemplateListItem | null>(null);

  const loadTemplates = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await docTemplatesApi.getTemplateList();
      setTemplates(response.templates);
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.error?.message ||
        err.message ||
        'Failed to load templates';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, [refreshTrigger]);

  const handleDelete = async (templateId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this template?')) {
      return;
    }

    setDeletingId(templateId);
    try {
      await docTemplatesApi.deleteTemplate(templateId);
      await loadTemplates();
      onDeleteTemplate?.(templateId);
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.error?.message ||
        err.message ||
        'Failed to delete template';
      alert(errorMsg);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownload = async (template: TemplateListItem, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const downloadUrl = docTemplatesApi.downloadTemplate(template.id);
      const apiKey = localStorage.getItem('api_key');
      
      if (apiKey) {
        // For file downloads, we need to use fetch with headers
        const response = await fetch(downloadUrl, {
          headers: {
            'X-API-Key': apiKey,
          },
        });
        
        if (!response.ok) {
          throw new Error('Download failed');
        }
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = template.file_name;
        link.click();
        window.URL.revokeObjectURL(url);
      } else {
        // Fallback to direct link if no API key
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = template.file_name;
        link.click();
      }
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.error?.message ||
        err.message ||
        'Failed to download template';
      alert(errorMsg);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (templates.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500 mb-4">
          <p className="text-lg font-medium mb-2">No templates available</p>
          <p className="text-sm">Upload a template to get started with document generation.</p>
        </div>
        {onSwitchToUpload && (
          <Button
            variant="primary"
            onClick={onSwitchToUpload}
          >
            Upload Template
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {templates.map((template) => (
        <div
          key={template.id}
          onClick={() => onSelectTemplate(template)}
          className={`
            border rounded-lg p-4 cursor-pointer transition-all
            ${
              selectedTemplateId === template.id
                ? 'border-blue-500 bg-blue-50 shadow-md'
                : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
            }
          `}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h4 className="text-lg font-semibold text-gray-900 truncate">
                {template.name}
              </h4>
              {template.description && (
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {template.description}
                </p>
              )}
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                <span>{template.file_name}</span>
                <span>•</span>
                <span>{formatFileSize(template.file_size)}</span>
                <span>•</span>
                <span>{template.variable_count} variables</span>
                <span>•</span>
                <span>Updated {formatDate(template.updated_at)}</span>
              </div>
            </div>
            <div className="ml-4 flex items-center gap-2">
              {selectedTemplateId === template.id && (
                <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded">
                  Selected
                </span>
              )}
              <Button
                variant="secondary"
                size="sm"
                onClick={(e) => handleDownload(template, e)}
              >
                Download
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingTemplate(template);
                }}
              >
                Edit
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={(e) => handleDelete(template.id, e)}
                disabled={deletingId === template.id}
                loading={deletingId === template.id}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      ))}
      
      {editingTemplate && (
        <TemplateEditDialog
          template={editingTemplate}
          onClose={() => setEditingTemplate(null)}
          onSave={async (name, description) => {
            try {
              await docTemplatesApi.updateTemplateMetadata(
                editingTemplate.id,
                name,
                description
              );
              await loadTemplates();
              onTemplateUpdated?.();
              setEditingTemplate(null);
            } catch (err: any) {
              const errorMsg =
                err.response?.data?.error?.message ||
                err.message ||
                'Failed to update template';
              alert(errorMsg);
            }
          }}
        />
      )}
    </div>
  );
};
