
import React from 'react';
import { ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface ZoomControlsProps {
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onScaleChange: (newScale: number) => void;
}

const ZoomControls: React.FC<ZoomControlsProps> = ({
  scale,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onScaleChange
}) => {
  return (
    <div className="flex items-center space-x-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={onZoomOut}
        className="p-1 rounded hover:bg-gray-200"
        title="Zoom Out"
      >
        <ZoomOut className="h-4 w-4" />
      </Button>
      <div className="flex items-center space-x-2">
        <span className="text-xs">{Math.round(scale * 100)}%</span>
        <div className="w-24">
          <Slider 
            value={[scale * 100]} 
            min={40} 
            max={300} 
            step={10} 
            onValueChange={(values) => onScaleChange(values[0] / 100)}
          />
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onZoomIn}
        className="p-1 rounded hover:bg-gray-200"
        title="Zoom In"
      >
        <ZoomIn className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onResetZoom}
        className="p-1 rounded hover:bg-gray-200"
        title="Reset Zoom"
      >
        Reset
      </Button>
    </div>
  );
};

export default ZoomControls;
