
import React, { useEffect, useRef } from 'react';
import { renderPdfPage } from '@/lib/pdfUtils';
import { PDFDocument } from '@/lib/types';
import { toast } from 'sonner';

interface PDFCanvasProps {
  document: PDFDocument;
  currentPage: number;
  scale: number;
  onDimensionsChange: (dimensions: { width: number; height: number }) => void;
}

const PDFCanvas: React.FC<PDFCanvasProps> = ({
  document,
  currentPage,
  scale,
  onDimensionsChange
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
        
        const dimensions = await renderPdfPage(
          containerRef.current,
          dataClone,
          currentPage,
          scale
        );
        
        onDimensionsChange(dimensions);
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
  }, [document, currentPage, scale, onDimensionsChange]);

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
