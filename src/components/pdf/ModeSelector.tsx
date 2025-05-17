
import React from 'react';
import { Move } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ModeSelectorProps {
  mode: 'select' | 'move' | 'resize';
  onModeChange: (mode: 'select' | 'move' | 'resize') => void;
}

const ModeSelector: React.FC<ModeSelectorProps> = ({ mode, onModeChange }) => {
  return (
    <div className="flex items-center space-x-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onModeChange('select')}
        className={`p-1 ${mode === 'select' ? 'bg-blue-100' : ''}`}
        title="Select Mode"
      >
        Select
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onModeChange('move')}
        className={`p-1 ${mode === 'move' ? 'bg-blue-100' : ''}`}
        title="Move Mode"
      >
        <Move className="h-4 w-4 mr-1" />
        Move
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onModeChange('resize')}
        className={`p-1 ${mode === 'resize' ? 'bg-blue-100' : ''}`}
        title="Resize Mode"
      >
        Resize
      </Button>
    </div>
  );
};

export default ModeSelector;
