
import React, { useEffect } from 'react';
import * as pdfjs from 'pdfjs-dist';
import { toast } from 'sonner';

interface PDFSelectionHandlerProps {
  viewportRef: React.MutableRefObject<pdfjs.PageViewport | null>;
  onRegionSelected?: (region: any) => void;
  pageHash: string;
}

const PDFSelectionHandler: React.FC<PDFSelectionHandlerProps> = ({
  viewportRef,
  onRegionSelected,
  pageHash
}) => {  // Setup box capture event handler
  useEffect(() => {
    const handleBoxCaptured = (e: CustomEvent) => {
      const { label, boxNorm, pageHash: capturedPageHash } = e.detail;
      
      if (onRegionSelected && boxNorm && viewportRef.current) {
        // Convert normalized coordinates back to PDF coordinates for the region
        const x = boxNorm.x1 * (viewportRef.current?.width || 0);
        const y = boxNorm.y1 * (viewportRef.current?.height || 0);
        const width = (boxNorm.x2 - boxNorm.x1) * (viewportRef.current?.width || 0);
        const height = (boxNorm.y2 - boxNorm.y1) * (viewportRef.current?.height || 0);
        
        // Create region object expected by the tag system
        const region = { x, y, width, height, label, pageHash: capturedPageHash || pageHash };
        
        // Pass to parent component
        onRegionSelected(region);
        
        // Show toast notification
        toast.success(`Selection captured`);
        
        console.log('Selection captured with coordinates:', boxNorm);
      }
    };
    
    // Add event listener for boxCaptured events
    window.addEventListener('boxCaptured', handleBoxCaptured as EventListener);
    
    return () => {
      window.removeEventListener('boxCaptured', handleBoxCaptured as EventListener);
    };
  }, [onRegionSelected, viewportRef, pageHash]);

  return null; // This is a behavior-only component with no visible UI
};

export default PDFSelectionHandler;
