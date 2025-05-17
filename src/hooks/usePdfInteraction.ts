
import { useState } from 'react';
import { Tag } from '@/lib/types';
import usePdfTagSelection from './usePdfTagSelection';
import usePdfSelectionState from './usePdfSelectionState';
import { resizeTag } from './usePdfTagResize';
import { findTagAtPosition, findResizeHandle } from '@/utils/pdfTagUtils';

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
  const [mode, setMode] = useState<'select' | 'move' | 'resize'>('select');
  
  const {
    isSelecting, 
    setIsSelecting,
    startPos, 
    setStartPos,
    currentPos, 
    setCurrentPos
  } = usePdfSelectionState();
  
  const { 
    selectedTagId, 
    setSelectedTagId,
    resizeHandle, 
    setResizeHandle,
    moveOffset, 
    setMoveOffset
  } = usePdfTagSelection();

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
      
      const tagUnderCursor = findTagAtPosition(x, y, existingTags, scaleFactor);
      
      if (tagUnderCursor) {
        setSelectedTagId(tagUnderCursor.id);
        setIsSelecting(true);
        
        // Save offset for move mode
        if (mode === 'move') {
          const tagLeft = tagUnderCursor.region.x / scaleFactor;
          const tagTop = tagUnderCursor.region.y / scaleFactor;
          
          setMoveOffset({
            x: x - tagLeft, 
            y: y - tagTop
          });
        }
        
        // For resize mode, determine which handle was clicked
        if (mode === 'resize') {
          const handleResult = findResizeHandle(x, y, tagUnderCursor, scaleFactor);
          setResizeHandle(handleResult);
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
          
          const newRegion = resizeTag({
            selectedTag,
            x,
            y,
            resizeHandle,
            tagLeft,
            tagTop,
            tagRight,
            tagBottom,
            scaleFactor
          });
          
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
