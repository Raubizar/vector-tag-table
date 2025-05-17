
import { useState } from 'react';

export interface Position {
  x: number;
  y: number;
}

export interface SelectionState {
  isSelecting: boolean;
  startPos: Position;
  currentPos: Position;
  selectionPurpose: 'tag' | 'zoom' | null;
}

export interface SelectionActions {
  setIsSelecting: (isSelecting: boolean) => void;
  setStartPos: (pos: Position) => void;
  setCurrentPos: (pos: Position) => void;
  setSelectionPurpose: (purpose: 'tag' | 'zoom' | null) => void;
  resetSelection: () => void;
}

export default function usePdfSelectionState(): [SelectionState, SelectionActions] {
  const [isSelecting, setIsSelecting] = useState(false);
  const [startPos, setStartPos] = useState<Position>({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = useState<Position>({ x: 0, y: 0 });
  const [selectionPurpose, setSelectionPurpose] = useState<'tag' | 'zoom' | null>(null);
  
  const resetSelection = () => {
    setIsSelecting(false);
    setStartPos({ x: 0, y: 0 });
    setCurrentPos({ x: 0, y: 0 });
    setSelectionPurpose(null);
  };

  return [
    { isSelecting, startPos, currentPos, selectionPurpose },
    { setIsSelecting, setStartPos, setCurrentPos, setSelectionPurpose, resetSelection }
  ];
}
