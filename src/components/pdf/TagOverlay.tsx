
import React from 'react';
import { Tag } from '@/lib/types';

interface TagOverlayProps {
  tag: Tag;
  scaleFactor: number;
  isSelected: boolean;
  mode: 'select' | 'move' | 'resize';
}

const TagOverlay: React.FC<TagOverlayProps> = ({ tag, scaleFactor, isSelected, mode }) => {
  // Prevent Infinity values in CSS by ensuring valid dimensions
  const left = isFinite(tag.region.x / scaleFactor) ? tag.region.x / scaleFactor : 0;
  const top = isFinite(tag.region.y / scaleFactor) ? tag.region.y / scaleFactor : 0;
  const width = isFinite(tag.region.width / scaleFactor) ? tag.region.width / scaleFactor : 0;
  const height = isFinite(tag.region.height / scaleFactor) ? tag.region.height / scaleFactor : 0;
  
  return (
    <div
      className={`absolute border-2 ${isSelected ? 'border-2 border-yellow-500' : ''} pointer-events-none`}
      style={{
        left: `${left}px`,
        top: `${top}px`,
        width: `${width}px`,
        height: `${height}px`,
        borderColor: tag.color,
        backgroundColor: `${tag.color}33`
      }}
    >
      <span
        className="absolute top-0 left-0 transform -translate-y-full text-xs px-1 rounded"
        style={{ backgroundColor: tag.color, color: 'white' }}
      >
        {tag.name}
      </span>
      
      {/* Resize handles - shown only for selected tag in resize mode */}
      {isSelected && mode === 'resize' && (
        <>
          <div className="absolute w-2 h-2 bg-white border border-black cursor-nwse-resize -top-1 -left-1 z-10" />
          <div className="absolute w-2 h-2 bg-white border border-black cursor-nesw-resize -top-1 -right-1 z-10" />
          <div className="absolute w-2 h-2 bg-white border border-black cursor-nesw-resize -bottom-1 -left-1 z-10" />
          <div className="absolute w-2 h-2 bg-white border border-black cursor-nwse-resize -bottom-1 -right-1 z-10" />
        </>
      )}
    </div>
  );
};

export default TagOverlay;
