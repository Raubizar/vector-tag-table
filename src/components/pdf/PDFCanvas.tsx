import React, { useEffect, useRef } from 'react';
import { renderPdfPage } from '@/lib/pdf/render';
import { PDFDocument } from '@/lib/types';
import { toast } from 'sonner';

interface PDFCanvasProps {
  document: PDFDocument;
  currentPage: number;
  scale: number;
  onDimensionsChange: (dimensions: { width: number; height: number }) => void;
  autoZoom?: boolean;
}

const PDFCanvas: React.FC<PDFCanvasProps> = ({
  document,
  currentPage,
  scale,
  onDimensionsChange,
  autoZoom = true
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastRenderAttemptRef = useRef<{
    documentId: string;
    page: number;
    scale: number;
  } | null>(null);

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
        if (canvasRef.current && containerRef.current.contains(canvasRef.current)) {
          containerRef.current.removeChild(canvasRef.current);
          canvasRef.current = null;
        }
        
        // Create new canvas using DOM methods
        const canvas = window.document.createElement('canvas');
        canvasRef.current = canvas;
        containerRef.current.appendChild(canvas);
        
        // Create a copy of the ArrayBuffer to prevent detachment
        const dataClone = new Uint8Array(document.data).buffer;
        
        // Show loading message for large PDFs at high zoom
        if (scale > 1.5) {
          console.log("Rendering large PDF at high zoom level:", scale);
        }
        
        // Render the PDF with optimized parameters for large format documents
        const dimensions = await renderPdfPage(
          containerRef.current,
          dataClone,
          currentPage,
          scale,
          {
            enableOptimizedRendering: true,
            enableProgressiveLoading: true,
            useHighQualityRendering: scale > 1.5
          }
        );
        
        onDimensionsChange(dimensions);
        
        // If autoZoom is enabled and this is the first render (scale == 1),
        // automatically zoom to the bottom right A4 area
        if (autoZoom && scale === 1 && dimensions.width > 1000) {
          // Wait a bit for the canvas to fully render
          setTimeout(() => {
            const a4WidthMm = 210; // A4 width in mm
            const a4HeightMm = 297; // A4 height in mm
            
            // Get the current PDF dimensions in pixels
            const pdfWidthPx = dimensions.width;
            const pdfHeightPx = dimensions.height;
            
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
        toast.error('Failed to render PDF');
      }
    };

    // Add a small delay when zooming to prevent too many render calls
    const renderTimer = setTimeout(() => {
      renderPdf();
    }, 100);
    
    // Cleanup function
    return () => {
      clearTimeout(renderTimer);
      if (canvasRef.current && containerRef.current && containerRef.current.contains(canvasRef.current)) {
        try {
          containerRef.current.removeChild(canvasRef.current);
          canvasRef.current = null;
        } catch (e) {
          console.error('Error during cleanup:', e);
        }
      }
    };
  }, [document, currentPage, scale, onDimensionsChange, autoZoom]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full"
      style={{ minHeight: "200px" }}
    >
      {/* PDF will be rendered here by the useEffect */}
    </div>
  );
};

export default PDFCanvas;
