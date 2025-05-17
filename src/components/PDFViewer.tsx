
import React, { useRef, useState, useCallback } from 'react';
import { PDFDocument, Tag } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import PDFCanvas from './pdf/PDFCanvas';
import TagOverlay from './pdf/TagOverlay';
import ZoomControls from './pdf/ZoomControls';
import ModeSelector from './pdf/ModeSelector';
import usePdfInteraction from '@/hooks/usePdfInteraction';
import { toast } from 'sonner';

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
  // Track the viewport position for zoom to region
  const [viewportOffset, setViewportOffset] = useState({ x: 0, y: 0 });
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Handle zoom to region
  const handleZoomToRegion = useCallback((region: { x: number, y: number, width: number, height: number }) => {
    if (!containerRef.current || !scrollContainerRef.current) return;
    
    // Calculate new scale to fit the region with some padding
    const containerWidth = scrollContainerRef.current.clientWidth;
    const containerHeight = scrollContainerRef.current.clientHeight;
    
    // Calculate the scale needed to fit the selection in the viewport (with padding)
    const padding = 20; // pixels of padding around the selection
    const scaleX = (containerWidth - 2 * padding) / region.width;
    const scaleY = (containerHeight - 2 * padding) / region.height;
    const newScale = Math.min(Math.min(scaleX, scaleY), 3); // Cap at 3x zoom
    
    // Set the new scale
    setScale(newScale);
    
    // After scale update, scroll to center the region
    setTimeout(() => {
      if (!scrollContainerRef.current) return;
      
      // Calculate the scroll position to center on the region
      const targetX = region.x * newScale - (containerWidth - region.width * newScale) / 2;
      const targetY = region.y * newScale - (containerHeight - region.height * newScale) / 2;
      
      // Set scroll position
      scrollContainerRef.current.scrollLeft = Math.max(0, targetX);
      scrollContainerRef.current.scrollTop = Math.max(0, targetY);
      
      toast.success("Zoomed to selection");
    }, 100);
  }, []);
  
  const {
    isSelecting,
    startPos,
    currentPos,
    mode,
    selectedTagId,
    selectionPurpose,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    setMode
  } = usePdfInteraction({
    pdfDimensions,
    existingTags,
    onRegionSelected,
    onTagUpdated,
    onZoomToRegion: handleZoomToRegion
  });

  const handleZoomIn = () => setScale(prev => Math.min(3, prev + 0.1));
  const handleZoomOut = () => setScale(prev => Math.max(0.4, prev - 0.1));
  const handleResetZoom = () => {
    setScale(1);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = 0;
      scrollContainerRef.current.scrollTop = 0;
    }
  };
  const handleScaleChange = (newScale: number) => setScale(newScale);

  const selectionStyle = {
    left: `${Math.min(startPos.x, currentPos.x)}px`,
    top: `${Math.min(startPos.y, currentPos.y)}px`,
    width: `${Math.abs(currentPos.x - startPos.x)}px`,
    height: `${Math.abs(currentPos.y - startPos.y)}px`,
    display: isSelecting ? 'block' : 'none',
    // Use different colors for different selection purposes
    borderColor: selectionPurpose === 'zoom' ? 'rgba(50, 205, 50, 0.8)' : 'rgba(59, 130, 246, 0.8)',
    backgroundColor: selectionPurpose === 'zoom' ? 'rgba(50, 205, 50, 0.2)' : 'rgba(59, 130, 246, 0.2)'
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
        
        <div 
          ref={scrollContainerRef}
          className="overflow-auto max-h-[70vh] relative"
        >
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
              className="absolute border-2 pointer-events-none"
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
