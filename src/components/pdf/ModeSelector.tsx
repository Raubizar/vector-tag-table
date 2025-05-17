
import React from 'react';
import { Button } from '@/components/ui/button';
import { PointerIcon, MoveIcon, ZoomInIcon } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

interface ModeSelectorProps {
  mode: string;
  onModeChange: (mode: 'select' | 'move' | 'resize' | 'zoom') => void;
}

const ModeSelector: React.FC<ModeSelectorProps> = ({ mode, onModeChange }) => {
  return (
    <ToggleGroup type="single" value={mode} onValueChange={(value) => {
      if (value) onModeChange(value as 'select' | 'move' | 'resize' | 'zoom');
    }}>
      <ToggleGroupItem value="select" aria-label="Select mode" title="Select area">
        <PointerIcon className="h-4 w-4" />
      </ToggleGroupItem>
      
      <ToggleGroupItem value="move" aria-label="Move mode" title="Move tags">
        <MoveIcon className="h-4 w-4" />
      </ToggleGroupItem>
      
      <ToggleGroupItem value="resize" aria-label="Resize mode" title="Resize tags">
        {/* Changed from StretchIcon to make it work with available icons */}
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="12" y1="4" x2="12" y2="20" />
        </svg>
      </ToggleGroupItem>
      
      <ToggleGroupItem value="zoom" aria-label="Zoom mode" title="Zoom to selection">
        <ZoomInIcon className="h-4 w-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  );
};

export default ModeSelector;
