
import { useState } from 'react';
import { Tag } from '@/lib/types';
import usePdfTagSelection from '../usePdfTagSelection';
import usePdfSelectionState from '../usePdfSelectionState';
import { usePdfMouseHandlers } from './usePdfMouseHandlers';
import { InteractionMode } from './constants';

interface UsePdfInteractionProps {
  pdfDimensions: { width: number; height: number };
  existingTags: Tag[];
  onRegionSelected: (region: Tag['region']) => void;
  onTagUpdated?: (tagId: string, newRegion: Tag['region']) => void;
  onZoomToRegion?: (region: { x: number, y: number, width: number, height: number }) => void;
}

export default function usePdfInteraction({
  pdfDimensions,
  existingTags,
  onRegionSelected,
  onTagUpdated,
  onZoomToRegion
}: UsePdfInteractionProps) {
  const [mode, setMode] = useState<InteractionMode>('select');
  
  const [
    { isSelecting, startPos, currentPos, selectionPurpose },
    { setIsSelecting, setStartPos, setCurrentPos, setSelectionPurpose, resetSelection }
  ] = usePdfSelectionState();
  
  const [
    { selectedTagId, resizeHandle, moveOffset },
    { setSelectedTagId, setResizeHandle, setMoveOffset, resetTagSelection }
  ] = usePdfTagSelection();

  const { handleMouseDown, handleMouseMove, handleMouseUp } = usePdfMouseHandlers({
    mode,
    pdfDimensions,
    existingTags,
    isSelecting, 
    startPos, 
    currentPos, 
    selectedTagId,
    moveOffset,
    resizeHandle,
    selectionPurpose,
    setIsSelecting, 
    setStartPos, 
    setCurrentPos,
    setSelectedTagId,
    setSelectionPurpose,
    setMoveOffset,
    setResizeHandle,
    onRegionSelected,
    onTagUpdated,
    onZoomToRegion,
    resetSelection,
    resetTagSelection
  });

  return {
    mode,
    setMode,
    isSelecting,
    startPos,
    currentPos,
    selectedTagId,
    resizeHandle,
    selectionPurpose,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp
  };
}
