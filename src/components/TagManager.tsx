
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tag } from '@/lib/types';
import { X } from 'lucide-react';

interface TagManagerProps {
  tags: Tag[];
  currentTag: Partial<Tag> | null;
  onSaveTag: (tag: Omit<Tag, 'id'>) => void;
  onDeleteTag: (id: string) => void;
  onSelectTag: (tag: Tag) => void;
}

const TagManager: React.FC<TagManagerProps> = ({
  tags,
  currentTag,
  onSaveTag,
  onDeleteTag,
  onSelectTag
}) => {
  const [tagName, setTagName] = useState('');
  const [tagColor, setTagColor] = useState('#1E88E5');

  const handleSaveTag = () => {
    if (!tagName.trim()) return;
    if (!currentTag?.region) return;

    onSaveTag({
      name: tagName,
      color: tagColor,
      region: currentTag.region
    });
    
    // Reset form
    setTagName('');
  };

  // Color options
  const colorOptions = [
    '#1E88E5', // Blue
    '#43A047', // Green
    '#E53935', // Red
    '#FB8C00', // Orange
    '#8E24AA', // Purple
    '#3949AB', // Indigo
    '#00ACC1', // Cyan
    '#F4511E', // Deep Orange
    '#6D4C41', // Brown
    '#546E7A'  // Blue Grey
  ];

  return (
    <div className="space-y-4">
      <div className="p-4 border rounded-lg">
        <h3 className="font-medium mb-3">Create New Tag</h3>
        
        <div className="space-y-3">
          <div>
            <label htmlFor="tag-name" className="block text-sm font-medium text-gray-700 mb-1">
              Tag Name
            </label>
            <Input
              id="tag-name"
              value={tagName}
              onChange={(e) => setTagName(e.target.value)}
              placeholder="e.g., Room Number, Equipment ID"
              className="w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tag Color
            </label>
            <div className="flex flex-wrap gap-2">
              {colorOptions.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`w-6 h-6 rounded-full ${
                    tagColor === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setTagColor(color)}
                  aria-label={`Select color ${color}`}
                />
              ))}
            </div>
          </div>
          
          <Button
            onClick={handleSaveTag}
            disabled={!tagName.trim() || !currentTag?.region}
            className="w-full"
          >
            Save Tag
          </Button>
        </div>
      </div>

      {tags.length > 0 && (
        <div className="p-4 border rounded-lg">
          <h3 className="font-medium mb-3">Defined Tags</h3>
          <ul className="space-y-2">
            {tags.map((tag) => (
              <li
                key={tag.id}
                className="flex items-center justify-between p-2 rounded hover:bg-gray-50 cursor-pointer"
                onClick={() => onSelectTag(tag)}
              >
                <div className="flex items-center">
                  <div
                    className="w-4 h-4 rounded-full mr-2"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span>{tag.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteTag(tag.id);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default TagManager;
