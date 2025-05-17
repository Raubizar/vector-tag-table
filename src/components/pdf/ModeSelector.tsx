
import React from 'react';
import { Button } from '@/components/ui/button';
import { PointerIcon, MoveIcon, StretchIcon, ZoomInIcon } from 'lucide-react';
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
        <StretchIcon className="h-4 w-4" />
      </ToggleGroupItem>
      
      <ToggleGroupItem value="zoom" aria-label="Zoom mode" title="Zoom to selection">
        <ZoomInIcon className="h-4 w-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  );
};

export default ModeSelector;
