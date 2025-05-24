
import React, { useRef, useEffect, memo } from 'react';
import { PDFDocument } from '@/lib/types';
import { usePdfRendering } from '@/hooks/usePdfRendering';
import PDFSelectionHandler from './PDFSelectionHandler';
import fixPdfViewerInteractions from '@/utils/pdfViewerFixes';

interface PDFCanvasProps {
  document: PDFDocument;
  currentPage: number;
  scale: number;
  onDimensionsChange: (dimensions: { width: number; height: number }) => void;
  autoZoom?: boolean;
  onRegionSelected?: (region: any) => void;
}

const PDFCanvas: React.FC<PDFCanvasProps> = ({
  document,
  currentPage,
  scale,
  onDimensionsChange,
  autoZoom = true,
  onRegionSelected
}) => {  
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Use our PDF rendering hook
  const {
    textLayerRef,
    viewportRef,
    pageHash
  } = usePdfRendering({
    document,
    currentPage,
    scale,
    containerRef,
    onDimensionsChange,
    enableTextLayer: true,
    enableTextCapture: true,
    autoZoom
  });
  
  // Apply interaction fixes only when document or page changes to prevent flickering
  useEffect(() => {
    if (!containerRef.current) return;
    
    console.log('Applying PDF interaction fixes');
    
    // Small delay to ensure DOM is ready, but not too long to avoid flickering
    const timeoutId = window.setTimeout(() => {
      if (containerRef.current) {
        fixPdfViewerInteractions(containerRef.current);
      }
    }, 50);
    
    return () => window.clearTimeout(timeoutId);
  }, [document.id, currentPage]); // Only re-run on document/page change
  
  return (
    <div
      ref={containerRef}
      className="relative w-full h-full pdf-canvas-container"
      style={{ 
        minHeight: "400px",
        willChange: "transform",
        backfaceVisibility: "hidden" // Reduce flickering
      }}
    >
      {/* PDF will be rendered here by the rendering hook */}
      
      {/* Selection handler component */}
      <PDFSelectionHandler 
        viewportRef={viewportRef}
        onRegionSelected={onRegionSelected}
        pageHash={pageHash}
      />
      
      {/* CSS for text layer styling */}
      <style>{`
        .pdf-text-layer {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          overflow: hidden;
          line-height: 1.0;
          opacity: 0.2;
          cursor: text;
          user-select: text;
          pointer-events: auto;
        }
        .pdf-text-layer ::selection {
          background: rgba(59, 130, 246, 0.3);
        }
        .pdf-text-layer span {
          position: absolute;
          white-space: pre;
          cursor: text;
          transform-origin: 0% 0%;
        }
      `}</style>
    </div>
  );
};

// Use memo with custom comparison to prevent unnecessary re-renders
export default memo(PDFCanvas, (prevProps, nextProps) => {
  // Only re-render if these specific props change
  return (
    prevProps.document.id === nextProps.document.id &&
    prevProps.currentPage === nextProps.currentPage &&
    Math.abs(prevProps.scale - nextProps.scale) < 0.01 &&
    prevProps.autoZoom === nextProps.autoZoom
  );
});
