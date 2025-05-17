
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

  useEffect(() => {
    const renderPdf = async () => {
      if (!containerRef.current || !document.data) return;
      
      try {
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

    renderPdf();
    
    // Cleanup function
    return () => {
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
