
import { useState } from 'react';
import { Tag } from '@/lib/types';

interface UsePdfInteractionProps {
  pdfDimensions: { width: number; height: number };
  existingTags: Tag[];
  onRegionSelected: (region: Tag['region']) => void;
  onTagUpdated?: (tagId: string, newRegion: Tag['region']) => void;
}

export default function usePdfInteraction({
  pdfDimensions,
  existingTags,
  onRegionSelected,
  onTagUpdated
}: UsePdfInteractionProps) {
  const [isSelecting, setIsSelecting] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });
  const [mode, setMode] = useState<'select' | 'move' | 'resize'>('select');
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [moveOffset, setMoveOffset] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent, containerRect: DOMRect) => {
    const x = e.clientX - containerRect.left;
    const y = e.clientY - containerRect.top;

    // Set start and current positions
    setStartPos({ x, y });
    setCurrentPos({ x, y });

    // Different behavior based on mode
    if (mode === 'select') {
      setIsSelecting(true);
      setSelectedTagId(null);
    } else if (mode === 'move' || mode === 'resize') {
      // Check if clicking on an existing tag
      const scaleFactor = pdfDimensions.width / (containerRect.width || 1);
      
      for (const tag of existingTags) {
        const tagLeft = tag.region.x / scaleFactor;
        const tagTop = tag.region.y / scaleFactor;
        const tagRight = tagLeft + tag.region.width / scaleFactor;
        const tagBottom = tagTop + tag.region.height / scaleFactor;

        // Check if click is inside tag
        if (x >= tagLeft && x <= tagRight && y >= tagTop && y <= tagBottom) {
          setSelectedTagId(tag.id);
          setIsSelecting(true);
          
          // Save offset for move mode
          if (mode === 'move') {
            setMoveOffset({
              x: x - tagLeft, 
              y: y - tagTop
            });
          }
          
          // For resize mode, determine which handle was clicked
          if (mode === 'resize') {
            const handleSize = 10;
            
            // Check corners for resize handles
            if (Math.abs(x - tagLeft) < handleSize && Math.abs(y - tagTop) < handleSize) {
              setResizeHandle('top-left');
            } else if (Math.abs(x - tagRight) < handleSize && Math.abs(y - tagTop) < handleSize) {
              setResizeHandle('top-right');
            } else if (Math.abs(x - tagLeft) < handleSize && Math.abs(y - tagBottom) < handleSize) {
              setResizeHandle('bottom-left');
            } else if (Math.abs(x - tagRight) < handleSize && Math.abs(y - tagBottom) < handleSize) {
              setResizeHandle('bottom-right');
            }
          }
          
          break;
        }
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent, containerRect: DOMRect) => {
    if (!isSelecting) return;

    const x = Math.max(0, Math.min(e.clientX - containerRect.left, containerRect.width));
    const y = Math.max(0, Math.min(e.clientY - containerRect.top, containerRect.height));

    setCurrentPos({ x, y });

    if (selectedTagId && onTagUpdated) {
      const scaleFactor = pdfDimensions.width / (containerRect.width || 1);
      const selectedTag = existingTags.find(tag => tag.id === selectedTagId);
      
      if (selectedTag) {
        if (mode === 'move') {
          // Calculate new position accounting for the offset
          const newX = x - moveOffset.x;
          const newY = y - moveOffset.y;
          
          // Update tag position
          const newRegion = {
            x: newX * scaleFactor,
            y: newY * scaleFactor,
            width: selectedTag.region.width,
            height: selectedTag.region.height
          };
          
          onTagUpdated(selectedTagId, newRegion);
        } else if (mode === 'resize' && resizeHandle) {
          const tagLeft = selectedTag.region.x / scaleFactor;
          const tagTop = selectedTag.region.y / scaleFactor;
          const tagRight = tagLeft + selectedTag.region.width / scaleFactor;
          const tagBottom = tagTop + selectedTag.region.height / scaleFactor;
          
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
          
          onTagUpdated(selectedTagId, newRegion);
        }
      }
    }
  };

  const handleMouseUp = (containerRect: DOMRect) => {
    if (!isSelecting) return;
    
    // For selection mode, create a new tag
    if (mode === 'select' && !selectedTagId) {
      // Calculate selection rectangle
      const x = Math.min(startPos.x, currentPos.x);
      const y = Math.min(startPos.y, currentPos.y);
      const width = Math.abs(currentPos.x - startPos.x);
      const height = Math.abs(currentPos.y - startPos.y);

      // Ignore very small selections (likely clicks)
      if (width > 5 && height > 5) {
        // Convert to PDF coordinates
        const scaleFactor = pdfDimensions.width / (containerRect.width || 1);
        
        const region = {
          x: x * scaleFactor,
          y: y * scaleFactor,
          width: width * scaleFactor,
          height: height * scaleFactor
        };

        onRegionSelected(region);
      }
    }
    
    setIsSelecting(false);
    setSelectedTagId(null);
    setResizeHandle(null);
  };

  return {
    isSelecting,
    startPos,
    currentPos,
    mode,
    selectedTagId,
    resizeHandle,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    setMode
  };
}
