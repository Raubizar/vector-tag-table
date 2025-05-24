
import { useState, useEffect, useRef } from 'react';
import { renderPdfPage } from '@/lib/pdf/render';
import { PDFDocument } from '@/lib/types';
import { toast } from 'sonner';
import { cloneArrayBuffer, isArrayBufferDetached } from '@/lib/pdf/safeBufferUtils';
import * as pdfjs from 'pdfjs-dist';

interface UsePdfRenderingProps {
  document: PDFDocument;
  currentPage: number;
  scale: number;
  containerRef: React.RefObject<HTMLDivElement>;
  onDimensionsChange: (dimensions: { width: number; height: number }) => void;
  enableTextLayer?: boolean;
  enableTextCapture?: boolean;
  autoZoom?: boolean;
}

interface RenderResult {
  textLayerRef: React.MutableRefObject<HTMLDivElement | null>;
  viewportRef: React.MutableRefObject<pdfjs.PageViewport | null>;
  canvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
  pageHash: string;
}

export const usePdfRendering = ({
  document,
  currentPage,
  scale,
  containerRef,
  onDimensionsChange,
  enableTextLayer = true,
  enableTextCapture = true,
  autoZoom = true
}: UsePdfRenderingProps): RenderResult => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const textLayerRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<pdfjs.PageViewport | null>(null);
  const lastRenderAttemptRef = useRef<{
    documentId: string;
    page: number;
    scale: number;
  } | null>(null);
  const [pageHash, setPageHash] = useState<string>('');

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
        
        // Generate page hash for template identification
        const currentPageHash = `page_${currentPage}_${scale.toFixed(2)}`;
        setPageHash(currentPageHash);
        
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
            enableTextLayer, 
            enableTextCapture,
            pageHash: currentPageHash
          }
        );
        
        // Store references to rendered elements
        if (renderResult.textLayer) {
          textLayerRef.current = renderResult.textLayer;
        }
        
        if (renderResult.viewport) {
          viewportRef.current = renderResult.viewport;
        }
        
        // Update dimensions for parent components
        onDimensionsChange({
          width: renderResult.width,
          height: renderResult.height
        });
        
        // Handle auto-zoom if enabled
        if (autoZoom && scale === 1 && renderResult.width > 1000) {
          handleAutoZoom(renderResult);
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
  }, [document, currentPage, scale, onDimensionsChange, autoZoom, enableTextLayer, enableTextCapture]);

  // Helper function to handle auto-zoom
  const handleAutoZoom = (renderResult: {width: number, height: number}) => {
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
  };

  return {
    textLayerRef,
    viewportRef,
    canvasRef,
    pageHash
  };
};
