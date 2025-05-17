
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { PDFDocument, Tag } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import usePdfInteraction from '@/hooks/usePdfInteraction';
import PDFViewerHeader from './pdf/PDFViewerHeader';
import PDFViewerContent from './pdf/PDFViewerContent';

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
    }, 100);
  }, []);
  
  // Listen for auto-zoom events
  useEffect(() => {
    const handleAutoZoom = (e: CustomEvent) => {
      if (e.detail) {
        handleZoomToRegion(e.detail);
      }
    };
    
    window.document.addEventListener('auto-zoom-to-region', handleAutoZoom as EventListener);
    
    return () => {
      window.document.removeEventListener('auto-zoom-to-region', handleAutoZoom as EventListener);
    };
  }, [handleZoomToRegion]);
  
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
        <PDFViewerHeader
          document={document}
          currentPage={currentPage}
          mode={mode}
          scale={scale}
          onModeChange={setMode}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetZoom={handleResetZoom}
          onScaleChange={handleScaleChange}
        />
        
        <div 
          ref={scrollContainerRef}
          className="overflow-auto max-h-[70vh] relative"
        >
          <PDFViewerContent
            document={document}
            currentPage={currentPage}
            scale={scale}
            pdfDimensions={pdfDimensions}
            isSelecting={isSelecting}
            startPos={startPos}
            currentPos={currentPos}
            mode={mode}
            selectionPurpose={selectionPurpose}
            selectedTagId={selectedTagId}
            existingTags={existingTags}
            onDimensionsChange={setPdfDimensions}
            onContainerInteraction={handleContainerInteraction}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default PDFViewer;
