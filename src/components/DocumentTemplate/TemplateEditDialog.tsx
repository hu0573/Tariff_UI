// Template edit dialog component
import { useState, useEffect } from 'react';
import { Button } from '@/components/common/Button';
import type { TemplateListItem } from '@/api/docTemplates';

interface TemplateEditDialogProps {
  template: TemplateListItem;
  onClose: () => void;
  onSave: (name: string, description: string) => Promise<void>;
}

export const TemplateEditDialog: React.FC<TemplateEditDialogProps> = ({
  template,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState(template.name);
  const [description, setDescription] = useState(template.description || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(template.name);
    setDescription(template.description || '');
  }, [template]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(name, description);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Edit Template</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Template Name (Optional)
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Leave empty to use file name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={saving}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Template description"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={saving}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={saving}
              loading={saving}
            >
              Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
