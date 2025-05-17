
import { useState } from 'react';

export interface SelectionState {
  isSelecting: boolean;
  setIsSelecting: (isSelecting: boolean) => void;
  startPos: { x: number; y: number };
  setStartPos: (pos: { x: number; y: number }) => void;
  currentPos: { x: number; y: number };
  setCurrentPos: (pos: { x: number; y: number }) => void;
  // Added for zoom selection
  selectionPurpose: 'tag' | 'zoom' | null;
  setSelectionPurpose: (purpose: 'tag' | 'zoom' | null) => void;
}

export default function usePdfSelectionState(): SelectionState {
  const [isSelecting, setIsSelecting] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });
  // Added for zoom selection purpose
  const [selectionPurpose, setSelectionPurpose] = useState<'tag' | 'zoom' | null>(null);
  
  return {
    isSelecting,
    setIsSelecting,
    startPos,
    setStartPos,
    currentPos,
    setCurrentPos,
    selectionPurpose,
    setSelectionPurpose
  };
}
