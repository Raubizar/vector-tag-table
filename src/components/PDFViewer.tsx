import React, { useRef, useState, useCallback, useEffect } from 'react';
import { PDFDocument, Tag } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import usePdfInteraction from '@/hooks/pdf/usePdfInteraction';
import usePdfZoom from '@/hooks/usePdfZoom';
import PDFViewerHeader from './pdf/PDFViewerHeader';
import PDFViewerContent from './pdf/PDFViewerContent';

interface PDFViewerProps {
  document: PDFDocument;
  currentPage: number;
  onRegionSelected: (region: Tag['region']) => void;
  existingTags?: Tag[];
  onTagUpdated?: (tagId: string, newRegion: Tag['region']) => void;
  autoZoomToBottomRight?: boolean;
}

const PDFViewer: React.FC<PDFViewerProps> = ({
  document,
  currentPage,
  onRegionSelected,
  existingTags = [],
  onTagUpdated,
  autoZoomToBottomRight = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdfDimensions, setPdfDimensions] = useState({ width: 0, height: 0 });
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const hasAutoZoomedRef = useRef<Map<string, boolean>>(new Map());
  
  // Use our refactored zoom hook
  const {
    scale,
    handleZoomIn,
    handleZoomOut,
    handleResetZoom,
    handleScaleChange,
    zoomToRegion
  } = usePdfZoom({ scrollContainerRef });
  
  // Use our refactored interaction hook
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
    onZoomToRegion: zoomToRegion
  });
  
  // Listen for auto-zoom events with improved event handling
  useEffect(() => {
    const handleAutoZoom = (e: CustomEvent) => {
      if (e.detail) {
        console.log('Received auto-zoom event:', e.detail);
        zoomToRegion(e.detail);
        // Mark this document as having been auto-zoomed
        hasAutoZoomedRef.current.set(document.id, true);
      }
    };
    
    window.document.addEventListener('auto-zoom-to-region', handleAutoZoom as EventListener);
    
    return () => {
      window.document.removeEventListener('auto-zoom-to-region', handleAutoZoom as EventListener);
    };
  }, [zoomToRegion, document.id]);

  // Reset auto-zoom state when document changes
  useEffect(() => {
    console.log('Document changed, resetting auto-zoom state:', document.id);
    // Clear the auto-zoom flag for new documents
    if (!hasAutoZoomedRef.current.has(document.id)) {
      hasAutoZoomedRef.current.set(document.id, false);
    }
  }, [document.id]);

  // Direct auto-zoom to bottom-right quadrant when enabled and conditions are met
  useEffect(() => {
    if (autoZoomToBottomRight && 
        pdfDimensions.width > 0 && 
        pdfDimensions.height > 0 && 
        !hasAutoZoomedRef.current.get(document.id)) {
      
      console.log('Triggering direct auto-zoom to bottom-right quadrant');
      
      // Calculate the bottom-right quadrant
      const bottomRightQuadrant = {
        x: pdfDimensions.width / 2,
        y: pdfDimensions.height / 2,
        width: pdfDimensions.width / 2,
        height: pdfDimensions.height / 2
      };
      
      console.log('Bottom-right quadrant:', bottomRightQuadrant);
      
      // Apply zoom with proper timing
      const timeoutId = setTimeout(() => {
        zoomToRegion(bottomRightQuadrant);
        hasAutoZoomedRef.current.set(document.id, true);
      }, 600); // Slightly longer delay for stability
      
      return () => clearTimeout(timeoutId);
    }
  }, [document.id, pdfDimensions, autoZoomToBottomRight, zoomToRegion]);

  const handleContainerInteraction = (event: React.MouseEvent) => {
    if (!containerRef.current) return;
    
    // Prevent default browser behaviors
    event.preventDefault();
    
    const rect = containerRef.current.getBoundingClientRect();
    
    if (event.type === 'mousedown') {
      handleMouseDown(event, rect);
    } else if (event.type === 'mousemove') {
      handleMouseMove(event, rect);
    } else if (event.type === 'mouseup' || event.type === 'mouseleave') {
      handleMouseUp(rect);
    }
  };

  // For text selection mode, we handle region selection directly from the canvas component
  const handleRegionSelected = useCallback((region: Tag['region']) => {
    if (mode === 'select') {
      onRegionSelected(region);
    }
  }, [mode, onRegionSelected]);

  return (
    <Card className="w-full mb-4 overflow-hidden">
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
          className="overflow-auto max-h-[85vh] relative"
          style={{ touchAction: 'pan-x pan-y' }}
        >
          <PDFViewerContent
            ref={containerRef}
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
            onRegionSelected={handleRegionSelected}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default PDFViewer;
