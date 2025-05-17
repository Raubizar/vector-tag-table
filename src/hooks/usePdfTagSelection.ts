
import { useState } from 'react';
import { Position } from './usePdfSelectionState';

export interface TagSelectionState {
  selectedTagId: string | null;
  resizeHandle: string | null;
  moveOffset: Position;
}

export interface TagSelectionActions {
  setSelectedTagId: (id: string | null) => void;
  setResizeHandle: (handle: string | null) => void;
  setMoveOffset: (offset: Position) => void;
  resetTagSelection: () => void;
}

export default function usePdfTagSelection(): [TagSelectionState, TagSelectionActions] {
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [moveOffset, setMoveOffset] = useState<Position>({ x: 0, y: 0 });
  
  const resetTagSelection = () => {
    setSelectedTagId(null);
    setResizeHandle(null);
    setMoveOffset({ x: 0, y: 0 });
  };
  
  return [
    { selectedTagId, resizeHandle, moveOffset },
    { setSelectedTagId, setResizeHandle, setMoveOffset, resetTagSelection }
  ];
}
