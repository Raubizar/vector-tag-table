import React, { useEffect, useRef, useState } from 'react';
import { renderPdfPage } from '@/lib/pdf/render';
import { PDFDocument } from '@/lib/types';
import { toast } from 'sonner';
import { cloneArrayBuffer, isArrayBufferDetached } from '@/lib/pdf/safeBufferUtils';
import { getTextSelectionRect, getSelectedText } from '@/lib/pdf/textSelection';
import * as pdfjs from 'pdfjs-dist';
import { setupTextSelectionCapture } from '@/lib/pdf/selectionCapture';

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
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const textLayerRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<pdfjs.PageViewport | null>(null);
  const [isTextLayerEnabled] = useState<boolean>(true);
  const lastRenderAttemptRef = useRef<{
    documentId: string;
    page: number;
    scale: number;
  } | null>(null);

  // Setup box capture event handler
  useEffect(() => {
    const handleBoxCaptured = (e: CustomEvent) => {
      const { label, boxNorm } = e.detail;
      
      if (onRegionSelected && boxNorm) {
        // Convert normalized coordinates back to PDF coordinates for the region
        const x = boxNorm.x1 * (viewportRef.current?.width || 0);
        const y = boxNorm.y1 * (viewportRef.current?.height || 0);
        const width = (boxNorm.x2 - boxNorm.x1) * (viewportRef.current?.width || 0);
        const height = (boxNorm.y2 - boxNorm.y1) * (viewportRef.current?.height || 0);
        
        // Create region object expected by the tag system
        const region = { x, y, width, height, label };
        
        // Pass to parent component
        onRegionSelected(region);
        
        // Show toast notification
        toast.success(`Selection captured: ${label}`);
        
        console.log('Normalized coordinates:', boxNorm);
      }
    };
    
    // Add event listener for boxCaptured events
    window.addEventListener('boxCaptured', handleBoxCaptured as EventListener);
    
    return () => {
      window.removeEventListener('boxCaptured', handleBoxCaptured as EventListener);
    };
  }, [onRegionSelected]);

  // For text selection, we don't need the manual text selection handler anymore
  // as this is now handled by setupTextSelectionCapture

  useEffect(() => {
    const renderPdf = async () => {
      if (!containerRef.current || !document.data) return;
      
      try {
        // Record this render attempt to avoid duplicate renders
        lastRenderAttemptRef.current = {
          documentId: document.id,
          page: currentPage,
          scale
        };
        
        // Clear container before rendering
        while (containerRef.current.firstChild) {
          containerRef.current.removeChild(containerRef.current.firstChild);
        }
        
        canvasRef.current = null;
        textLayerRef.current = null;
        
        // Create a safe copy of the ArrayBuffer to prevent detachment
        let pdfData: ArrayBuffer;
        
        try {
          // Check if buffer is already detached and warn about it
          if (isArrayBufferDetached(document.data)) {
            console.warn("Document data was already detached, this might cause issues");
            toast.error("Document buffer was detached. Try reloading the document.");
          }
          
          // Always create a fresh copy for each render operation
          pdfData = cloneArrayBuffer(document.data);
        } catch (err) {
          console.error("Failed to clone buffer, it might be detached:", err);
          toast.error("Failed to render PDF: buffer may be detached");
          return;
        }
        
        // Show loading message for large PDFs at high zoom
        if (scale > 1.5) {
          console.log("Rendering large PDF at high zoom level:", scale);
        }
        
        // Render the PDF with text layer enabled for selection
        const renderResult = await renderPdfPage(
          containerRef.current,
          pdfData,
          currentPage,
          scale,
          {
            enableOptimizedRendering: true,
            enableProgressiveLoading: true,
            useHighQualityRendering: scale > 1.5,
            enableTextLayer: isTextLayerEnabled, // Enable text layer for selection
            enableTextCapture: true // Enable the text selection capture functionality
          }
        );
        
        // Store references to rendered elements
        if (renderResult.textLayer) {
          textLayerRef.current = renderResult.textLayer;
          
          // Setup text selection capture on the text layer
          if (renderResult.viewport && renderResult.textLayer) {
            setupTextSelectionCapture(renderResult.textLayer, renderResult.viewport);
          }
        }
        
        if (renderResult.viewport) {
          viewportRef.current = renderResult.viewport;
        }
        
        // Update dimensions for parent components
        onDimensionsChange({
          width: renderResult.width,
          height: renderResult.height
        });
        
        // If autoZoom is enabled and this is the first render (scale == 1),
        // automatically zoom to the bottom right A4 area
        if (autoZoom && scale === 1 && renderResult.width > 1000) {
          // Wait a bit for the canvas to fully render
          setTimeout(() => {
            const a4WidthMm = 210; // A4 width in mm
            const a4HeightMm = 297; // A4 height in mm
            
            // Get the current PDF dimensions in pixels
            const pdfWidthPx = renderResult.width;
            const pdfHeightPx = renderResult.height;
            
            // Calculate A4 size in the current PDF's pixel scale
            const pxPerMm = Math.min(pdfWidthPx / 841, pdfHeightPx / 1189); // A0 size is 841×1189 mm
            const a4WidthPx = a4WidthMm * pxPerMm;
            const a4HeightPx = a4HeightMm * pxPerMm;
            
            // Calculate the bottom right A4 area (with some padding)
            const padding = 20; // pixels
            const targetRegion = {
              x: Math.max(0, pdfWidthPx - a4WidthPx - padding),
              y: Math.max(0, pdfHeightPx - a4HeightPx - padding),
              width: Math.min(a4WidthPx, pdfWidthPx),
              height: Math.min(a4HeightPx, pdfHeightPx)
            };
            
            // Dispatch a custom event to trigger zooming to this region
            const zoomEvent = new CustomEvent('auto-zoom-to-region', { 
              detail: targetRegion
            });
            window.document.dispatchEvent(zoomEvent);
            
            toast.info("Auto-zoomed to A4 size area");
          }, 500);
        }
      } catch (error) {
        console.error('Error rendering PDF:', error);
        toast.error('Failed to render PDF. The file might be corrupted or too large.');
      }
    };

    // Add a small delay when zooming to prevent too many render calls
    const renderTimer = setTimeout(() => {
      renderPdf();
    }, 100);
    
    // Cleanup function
    return () => {
      clearTimeout(renderTimer);
    };
  }, [document, currentPage, scale, onDimensionsChange, autoZoom, isTextLayerEnabled]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full"
      style={{ minHeight: "200px" }}
    >
      {/* PDF will be rendered here by the useEffect */}
      {/* Text layer will also be rendered here */}
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
