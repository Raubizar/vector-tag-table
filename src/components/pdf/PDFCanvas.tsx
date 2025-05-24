
import React, { useRef, useEffect } from 'react';
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
  
  // Apply our interaction fixes
  useEffect(() => {
    if (containerRef.current) {
      fixPdfViewerInteractions(containerRef.current);
    }
  }, [document, currentPage, scale]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full pdf-canvas-container"
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

export default PDFCanvas;
