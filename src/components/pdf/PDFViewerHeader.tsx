
import React from 'react';
import { PDFDocument } from '@/lib/types';
import ModeSelector from './ModeSelector';
import ZoomControls from './ZoomControls';
import { InteractionMode } from '@/hooks/pdf/constants';

interface PDFViewerHeaderProps {
  document: PDFDocument;
  currentPage: number;
  mode: InteractionMode;
  scale: number;
  onModeChange: (mode: InteractionMode) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onScaleChange: (newScale: number) => void;
}

const PDFViewerHeader: React.FC<PDFViewerHeaderProps> = ({
  document,
  currentPage,
  mode,
  scale,
  onModeChange,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onScaleChange
}) => {
  return (
    <div className="bg-gray-100 p-2 flex justify-between items-center">
      <span className="font-medium truncate max-w-md">
        {document.name} (Page {currentPage})
      </span>
      <div className="flex items-center space-x-2">
        <ModeSelector mode={mode} onModeChange={onModeChange} />
        <div className="h-4 border-r border-gray-300"></div>
        <ZoomControls 
          scale={scale}
          onZoomIn={onZoomIn}
          onZoomOut={onZoomOut}
          onResetZoom={onResetZoom}
          onScaleChange={onScaleChange}
        />
      </div>
    </div>
  );
};

export default PDFViewerHeader;
