
import React from 'react';
import { Tag } from '@/lib/types';
import { InteractionMode } from '@/hooks/pdf/constants';

interface TagOverlayProps {
  tag: Tag;
  scaleFactor: number;
  isSelected: boolean;
  mode: InteractionMode;
}

const TagOverlay: React.FC<TagOverlayProps> = ({ tag, scaleFactor, isSelected, mode }) => {
  // Prevent Infinity values in CSS by ensuring valid dimensions
  const left = isFinite(tag.region.x / scaleFactor) ? tag.region.x / scaleFactor : 0;
  const top = isFinite(tag.region.y / scaleFactor) ? tag.region.y / scaleFactor : 0;
  const width = isFinite(tag.region.width / scaleFactor) ? tag.region.width / scaleFactor : 0;
  const height = isFinite(tag.region.height / scaleFactor) ? tag.region.height / scaleFactor : 0;
  
  // Determine cursor based on mode
  let cursor = 'default';
  if (mode === 'move') cursor = 'move';
  else if (mode === 'resize') cursor = 'crosshair';
  else if (mode === 'zoom') cursor = 'zoom-in';
  
  return (
    <div
      className={`absolute ${isSelected ? 'border-2 border-yellow-500' : 'border'}`}
      style={{
        left: `${left}px`,
        top: `${top}px`,
        width: `${width}px`,
        height: `${height}px`,
        borderColor: tag.color,
        backgroundColor: `${tag.color}33`,
        cursor: cursor,
        pointerEvents: 'auto', // Allow mouse events
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
          <div className="absolute w-3 h-3 bg-white border border-black cursor-nwse-resize -top-1.5 -left-1.5 z-10" />
          <div className="absolute w-3 h-3 bg-white border border-black cursor-nesw-resize -top-1.5 -right-1.5 z-10" />
          <div className="absolute w-3 h-3 bg-white border border-black cursor-nesw-resize -bottom-1.5 -left-1.5 z-10" />
          <div className="absolute w-3 h-3 bg-white border border-black cursor-nwse-resize -bottom-1.5 -right-1.5 z-10" />
        </>
      )}
    </div>
  );
};

export default TagOverlay;
