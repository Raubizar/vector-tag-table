
import React, { useEffect, useRef } from 'react';
import { PDFDocument, Tag } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff } from 'lucide-react';

interface PDFTextDebugProps {
  document: PDFDocument | null;
  currentPage: number;
  tags: Tag[];
  selectedTagId: string | null;
  isDebugActive: boolean;
  onToggleDebug: () => void;
  onVisualize: (canvasRef: React.RefObject<HTMLCanvasElement>) => void;
}

const PDFTextDebug: React.FC<PDFTextDebugProps> = ({
  document,
  currentPage,
  tags,
  selectedTagId,
  isDebugActive,
  onToggleDebug,
  onVisualize
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (isDebugActive && document?.data) {
      onVisualize(canvasRef);
    }
  }, [isDebugActive, document, currentPage, selectedTagId, tags]);

  return (
    <div className={`absolute top-0 left-0 w-full h-full pointer-events-none ${isDebugActive ? 'z-10' : '-z-10'}`}>
      {/* Debug visualization canvas */}
      <canvas 
        ref={canvasRef}
        className={`absolute top-0 left-0 w-full h-full ${isDebugActive ? 'opacity-100' : 'opacity-0'}`}
      />
      
      {/* Debug controls */}
      <div className="absolute top-2 right-2 p-2 bg-white border rounded shadow pointer-events-auto">
        <div className="flex items-center space-x-2">
          <Switch 
            id="debug-mode" 
            checked={isDebugActive}
            onCheckedChange={onToggleDebug}
          />
          <Label htmlFor="debug-mode" className="flex items-center">
            {isDebugActive ? (
              <>
                <Eye className="h-4 w-4 mr-1" />
                <span>Text Debug On</span>
              </>
            ) : (
              <>
                <EyeOff className="h-4 w-4 mr-1" />
                <span>Text Debug Off</span>
              </>
            )}
          </Label>
        </div>
      </div>
    </div>
  );
};

export default PDFTextDebug;
