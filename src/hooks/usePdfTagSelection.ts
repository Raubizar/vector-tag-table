
import { useState } from 'react';
import { Tag } from '@/lib/types';

export interface TagSelectionState {
  selectedTagId: string | null;
  setSelectedTagId: (id: string | null) => void;
  resizeHandle: string | null;
  setResizeHandle: (handle: string | null) => void;
  moveOffset: { x: number; y: number };
  setMoveOffset: (offset: { x: number; y: number }) => void;
}

export default function usePdfTagSelection(): TagSelectionState {
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [moveOffset, setMoveOffset] = useState({ x: 0, y: 0 });
  
  return {
    selectedTagId,
    setSelectedTagId,
    resizeHandle,
    setResizeHandle,
    moveOffset,
    setMoveOffset
  };
}
