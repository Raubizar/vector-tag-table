
import React, { useEffect, useRef, useState } from 'react';
import { renderPdfPage } from '@/lib/pdfUtils';
import { PDFDocument, Tag } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

interface PDFViewerProps {
  document: PDFDocument;
  currentPage: number;
  onRegionSelected: (region: Tag['region']) => void;
  existingTags?: Tag[];
}

const PDFViewer: React.FC<PDFViewerProps> = ({
  document,
  currentPage,
  onRegionSelected,
  existingTags = []
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });
  const [pdfDimensions, setPdfDimensions] = useState({ width: 0, height: 0 });
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const renderPdf = async () => {
      if (containerRef.current && document.data) {
        try {
          const dimensions = await renderPdfPage(
            containerRef.current,
            document.data,
            currentPage,
            scale
          );
          setPdfDimensions(dimensions);
        } catch (error) {
          console.error('Error rendering PDF:', error);
          toast.error('Failed to render PDF');
        }
      }
    };

    renderPdf();
  }, [document, currentPage, scale]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setStartPos({ x, y });
    setCurrentPos({ x, y });
    setIsSelecting(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isSelecting || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));

    setCurrentPos({ x, y });
  };

  const handleMouseUp = () => {
    if (!isSelecting) return;

    // Calculate selection rectangle
    const x = Math.min(startPos.x, currentPos.x);
    const y = Math.min(startPos.y, currentPos.y);
    const width = Math.abs(currentPos.x - startPos.x);
    const height = Math.abs(currentPos.y - startPos.y);

    // Ignore very small selections (likely clicks)
    if (width < 10 || height < 10) {
      setIsSelecting(false);
      return;
    }

    // Convert to PDF coordinates (assuming the canvas is scaled to fit container)
    const scaleFactor = pdfDimensions.width / containerRef.current!.clientWidth;
    
    const region = {
      x: x * scaleFactor,
      y: y * scaleFactor,
      width: width * scaleFactor,
      height: height * scaleFactor
    };

    onRegionSelected(region);
    setIsSelecting(false);
  };

  const handleZoomIn = () => setScale(prev => prev + 0.2);
  const handleZoomOut = () => setScale(prev => Math.max(0.4, prev - 0.2));
  const handleResetZoom = () => setScale(1);

  const selectionStyle = {
    left: Math.min(startPos.x, currentPos.x),
    top: Math.min(startPos.y, currentPos.y),
    width: Math.abs(currentPos.x - startPos.x),
    height: Math.abs(currentPos.y - startPos.y),
    display: isSelecting ? 'block' : 'none'
  };

  return (
    <Card className="w-full mb-6 overflow-hidden">
      <CardContent className="p-0 relative">
        <div className="bg-gray-100 p-2 flex justify-between items-center">
          <span className="font-medium truncate max-w-md">
            {document.name} (Page {currentPage})
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleZoomOut}
              className="p-1 rounded hover:bg-gray-200"
              title="Zoom Out"
            >
              -
            </button>
            <button
              onClick={handleResetZoom}
              className="p-1 rounded hover:bg-gray-200"
              title="Reset Zoom"
            >
              {Math.round(scale * 100)}%
            </button>
            <button
              onClick={handleZoomIn}
              className="p-1 rounded hover:bg-gray-200"
              title="Zoom In"
            >
              +
            </button>
          </div>
        </div>
        
        <div className="overflow-auto max-h-[70vh] relative">
          <div
            ref={containerRef}
            className="relative"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* PDF will be rendered here */}
            <div
              className="absolute border-2 border-blue-500 bg-blue-200 bg-opacity-30 pointer-events-none"
              style={selectionStyle}
            />
            
            {/* Render existing tags */}
            {existingTags.map((tag) => (
              <div
                key={tag.id}
                className="absolute border-2 pointer-events-none"
                style={{
                  left: tag.region.x / (pdfDimensions.width / containerRef.current?.clientWidth || 1),
                  top: tag.region.y / (pdfDimensions.width / containerRef.current?.clientWidth || 1),
                  width: tag.region.width / (pdfDimensions.width / containerRef.current?.clientWidth || 1),
                  height: tag.region.height / (pdfDimensions.width / containerRef.current?.clientWidth || 1),
                  borderColor: tag.color,
                  backgroundColor: `${tag.color}33`
                }}
              >
                <span
                  className="absolute top-0 left-0 transform -translate-y-full text-xs px-1 rounded"
                  style={{ backgroundColor: tag.color, color: 'white' }}
                >
                  {tag.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PDFViewer;
