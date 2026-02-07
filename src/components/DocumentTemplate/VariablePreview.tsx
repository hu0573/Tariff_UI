// Variable preview component
import type { TemplateDetail } from '@/api/docTemplates';
import { Badge } from '@/components/common/Badge';

interface VariablePreviewProps {
  template: TemplateDetail | null;
}

export const VariablePreview: React.FC<VariablePreviewProps> = ({
  template,
}) => {
  if (!template) {
    return (
      <div className="text-center py-8 text-gray-500">
        Select a template to view variables
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

  const getMappingTypeBadge = (mapping: Record<string, any> | undefined) => {
    if (!mapping) {
      return <Badge variant="warning">Not configured</Badge>;
    }

    const mappingType = mapping.mapping_type;
    if (mappingType === 'special_field') {
      return <Badge variant="info">special_field</Badge>;
    } else if (mappingType === 'user_information') {
      return <Badge variant="success">user_information</Badge>;
    } else if (mappingType === 'chart') {
      return <Badge variant="info">chart</Badge>;
    } else if (mappingType === 'custom_text') {
      return <Badge variant="info">custom_text</Badge>;
    }
    return <Badge>{mappingType || 'Unknown'}</Badge>;
  };

  return (
    <div className="space-y-3">
      <div className="text-sm text-gray-600 mb-4">
        Found {template.variables.length} variable(s) in this template
      </div>
      <div className="space-y-2">
        {template.variables.map((variable, index) => (
          <div
            key={index}
            className="border border-gray-200 rounded-lg p-3 bg-white hover:border-gray-300 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                    {`{{${variable.name}}}`}
                  </code>
                  {getMappingTypeBadge(variable.mapping)}
                </div>
                {variable.description && (
                  <p className="text-sm text-gray-600 mt-1">
                    {variable.description}
                  </p>
                )}
                {variable.mapping && (
                  <div className="mt-2 text-xs text-gray-500 break-words">
                    <span className="font-medium">Mapping:</span>{' '}
                    {variable.mapping.mapping_type === 'special_field' &&
                      variable.mapping.source_field}
                    {variable.mapping.mapping_type === 'user_information' &&
                      `${variable.mapping.source_type}.${variable.mapping.source_field}`}
                    {variable.mapping.mapping_type === 'chart' &&
                      'Chart configuration'}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
