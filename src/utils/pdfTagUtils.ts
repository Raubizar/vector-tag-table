
import { Tag } from '@/lib/types';

export function findTagAtPosition(
  x: number, 
  y: number, 
  existingTags: Tag[], 
  scaleFactor: number
): Tag | null {
  for (const tag of existingTags) {
    const tagLeft = tag.region.x / scaleFactor;
    const tagTop = tag.region.y / scaleFactor;
    const tagRight = tagLeft + tag.region.width / scaleFactor;
    const tagBottom = tagTop + tag.region.height / scaleFactor;

    // Check if point is inside tag
    if (x >= tagLeft && x <= tagRight && y >= tagTop && y <= tagBottom) {
      return tag;
    }
  }
  
  return null;
}

export function findResizeHandle(
  x: number,
  y: number,
  tag: Tag,
  scaleFactor: number,
  handleSize: number = 10
): string | null {
  const tagLeft = tag.region.x / scaleFactor;
  const tagTop = tag.region.y / scaleFactor;
  const tagRight = tagLeft + tag.region.width / scaleFactor;
  const tagBottom = tagTop + tag.region.height / scaleFactor;
  
  // Check corners for resize handles
  if (Math.abs(x - tagLeft) < handleSize && Math.abs(y - tagTop) < handleSize) {
    return 'top-left';
  } else if (Math.abs(x - tagRight) < handleSize && Math.abs(y - tagTop) < handleSize) {
    return 'top-right';
  } else if (Math.abs(x - tagLeft) < handleSize && Math.abs(y - tagBottom) < handleSize) {
    return 'bottom-left';
  } else if (Math.abs(x - tagRight) < handleSize && Math.abs(y - tagBottom) < handleSize) {
    return 'bottom-right';
  }
  
  return null;
}
