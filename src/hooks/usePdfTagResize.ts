
import { Tag } from '@/lib/types';

interface ResizeTagProps {
  selectedTag: Tag;
  x: number;
  y: number;
  resizeHandle: string | null;
  tagLeft: number;
  tagTop: number;
  tagRight: number;
  tagBottom: number;
  scaleFactor: number;
}

export function resizeTag({ 
  selectedTag, 
  x, 
  y, 
  resizeHandle,
  tagLeft,
  tagTop,
  tagRight,
  tagBottom,
  scaleFactor 
}: ResizeTagProps): Tag['region'] {
  let newRegion = { ...selectedTag.region };
  
  // Handle resizing based on which corner was grabbed
  switch (resizeHandle) {
    case 'top-left':
      newRegion = {
        x: x * scaleFactor,
        y: y * scaleFactor,
        width: (tagRight - x) * scaleFactor,
        height: (tagBottom - y) * scaleFactor
      };
      break;
    case 'top-right':
      newRegion = {
        x: selectedTag.region.x,
        y: y * scaleFactor,
        width: (x - tagLeft) * scaleFactor,
        height: (tagBottom - y) * scaleFactor
      };
      break;
    case 'bottom-left':
      newRegion = {
        x: x * scaleFactor,
        y: selectedTag.region.y,
        width: (tagRight - x) * scaleFactor,
        height: (y - tagTop) * scaleFactor
      };
      break;
    case 'bottom-right':
      newRegion = {
        x: selectedTag.region.x,
        y: selectedTag.region.y,
        width: (x - tagLeft) * scaleFactor,
        height: (y - tagTop) * scaleFactor
      };
      break;
  }
  
  // Ensure width and height are positive
  if (newRegion.width < 0) {
    newRegion.x = newRegion.x + newRegion.width;
    newRegion.width = Math.abs(newRegion.width);
  }
  
  if (newRegion.height < 0) {
    newRegion.y = newRegion.y + newRegion.height;
    newRegion.height = Math.abs(newRegion.height);
  }
  
  return newRegion;
}
