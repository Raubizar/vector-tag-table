
import React, { useRef, useState } from 'react';
import { PDFDocument, Tag } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import PDFCanvas from './pdf/PDFCanvas';
import TagOverlay from './pdf/TagOverlay';
import ZoomControls from './pdf/ZoomControls';
import ModeSelector from './pdf/ModeSelector';
import usePdfInteraction from '@/hooks/usePdfInteraction';

interface PDFViewerProps {
  document: PDFDocument;
  currentPage: number;
  onRegionSelected: (region: Tag['region']) => void;
  existingTags?: Tag[];
  onTagUpdated?: (tagId: string, newRegion: Tag['region']) => void;
}

const PDFViewer: React.FC<PDFViewerProps> = ({
  document,
  currentPage,
  onRegionSelected,
  existingTags = [],
  onTagUpdated
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdfDimensions, setPdfDimensions] = useState({ width: 0, height: 0 });
  const [scale, setScale] = useState(1);
  
  const {
    isSelecting,
    startPos,
    currentPos,
    mode,
    selectedTagId,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    setMode
  } = usePdfInteraction({
    pdfDimensions,
    existingTags,
    onRegionSelected,
    onTagUpdated
  });

  const handleZoomIn = () => setScale(prev => Math.min(3, prev + 0.1));
  const handleZoomOut = () => setScale(prev => Math.max(0.4, prev - 0.1));
  const handleResetZoom = () => setScale(1);
  const handleScaleChange = (newScale: number) => setScale(newScale);

  const selectionStyle = {
    left: `${Math.min(startPos.x, currentPos.x)}px`,
    top: `${Math.min(startPos.y, currentPos.y)}px`,
    width: `${Math.abs(currentPos.x - startPos.x)}px`,
    height: `${Math.abs(currentPos.y - startPos.y)}px`,
    display: isSelecting && !selectedTagId ? 'block' : 'none'
  };

  const handleContainerInteraction = (event: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    
    if (event.type === 'mousedown') {
      handleMouseDown(event, rect);
    } else if (event.type === 'mousemove') {
      handleMouseMove(event, rect);
    } else if (event.type === 'mouseup' || event.type === 'mouseleave') {
      handleMouseUp(rect);
    }
  };

  return (
    <Card className="w-full mb-6 overflow-hidden">
      <CardContent className="p-0 relative">
        <div className="bg-gray-100 p-2 flex justify-between items-center">
          <span className="font-medium truncate max-w-md">
            {document.name} (Page {currentPage})
          </span>
          <div className="flex items-center space-x-2">
            <ModeSelector mode={mode} onModeChange={setMode} />
            <div className="h-4 border-r border-gray-300"></div>
            <ZoomControls 
              scale={scale}
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              onResetZoom={handleResetZoom}
              onScaleChange={handleScaleChange}
            />
          </div>
        </div>
        
        <div className="overflow-auto max-h-[70vh] relative">
          <div
            ref={containerRef}
            className="relative"
            onMouseDown={handleContainerInteraction}
            onMouseMove={handleContainerInteraction}
            onMouseUp={handleContainerInteraction}
            onMouseLeave={handleContainerInteraction}
          >
            <PDFCanvas 
              document={document}
              currentPage={currentPage}
              scale={scale}
              onDimensionsChange={setPdfDimensions}
            />
            
            {/* Selection box overlay */}
            <div
              className="absolute border-2 border-blue-500 bg-blue-200 bg-opacity-30 pointer-events-none"
              style={selectionStyle}
            />
            
            {/* Render existing tags */}
            {existingTags.map((tag) => {
              if (!containerRef.current) return null;
              
              // Calculate proper scale factor based on rendered PDF size vs container size
              const scaleFactor = pdfDimensions.width / (containerRef.current.clientWidth || 1);
              const isSelected = selectedTagId === tag.id;
              
              return (
                <TagOverlay
                  key={tag.id}
                  tag={tag}
                  scaleFactor={scaleFactor}
                  isSelected={isSelected}
                  mode={mode}
                />
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PDFViewer;
