
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
  const renderTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    // Clear any pending render timeout on cleanup or dependency change
    return () => {
      if (renderTimeoutRef.current !== null) {
        clearTimeout(renderTimeoutRef.current);
        renderTimeoutRef.current = null;
      }
    };
  }, [document, currentPage, scale]);

  useEffect(() => {
    const renderPdf = async () => {
      if (!containerRef.current || !document.data) return;
      
      // Skip if we've already attempted this exact render
      const currentRender = {
        documentId: document.id,
        page: currentPage,
        scale
      };
      
      if (lastRenderAttemptRef.current && 
          lastRenderAttemptRef.current.documentId === currentRender.documentId &&
          lastRenderAttemptRef.current.page === currentRender.page &&
          Math.abs(lastRenderAttemptRef.current.scale - currentRender.scale) < 0.001) {
        return;
      }
      
      // Record this render attempt
      lastRenderAttemptRef.current = currentRender;
      
      try {
        // Clear container before rendering to prevent flicker from old content
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

    // Add a delay to prevent too many rapid renders causing flickering
    if (renderTimeoutRef.current !== null) {
      clearTimeout(renderTimeoutRef.current);
    }
    
    renderTimeoutRef.current = window.setTimeout(() => {
      renderPdf();
      renderTimeoutRef.current = null;
    }, 150); // Debounce renders
    
  }, [document, currentPage, scale, onDimensionsChange, autoZoom, enableTextLayer, enableTextCapture]);

  // Helper function to handle auto-zoom
  const handleAutoZoom = (renderResult: {width: number, height: number}) => {
    // Wait a bit for the canvas to fully render
    setTimeout(() => {
      // Calculate the bottom right quarter of the document
      const bottomRightQuadrant = {
        x: renderResult.width / 2, // Start at middle of width
        y: renderResult.height / 2, // Start at middle of height
        width: renderResult.width / 2, // Half width
        height: renderResult.height / 2 // Half height
      };
      
      // Dispatch a custom event to trigger zooming to this region
      const zoomEvent = new CustomEvent('auto-zoom-to-region', { 
        detail: bottomRightQuadrant
      });
      window.document.dispatchEvent(zoomEvent);
    }, 300);
  };

  return {
    textLayerRef,
    viewportRef,
    canvasRef,
    pageHash
  };
};
