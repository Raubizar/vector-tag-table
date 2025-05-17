
import React, { useEffect, useRef, useState } from 'react';
import { renderPdfPage } from '@/lib/pdfUtils';
import { PDFDocument, Tag } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { ZoomIn, ZoomOut, Move } from 'lucide-react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';

interface PDFViewerProps {
  document: PDFDocument;
  currentPage: number;
  onRegionSelected: (region: Tag['region']) => void;
  existingTags?: Tag[];
  onTagUpdated?: (tagId: string, newRegion: Tag['region']) => void;
}

const PDFViewer: React.FC<PDFViewerProps> = ({
  document,
  currentPage,
  onRegionSelected,
  existingTags = [],
  onTagUpdated
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });
  const [pdfDimensions, setPdfDimensions] = useState({ width: 0, height: 0 });
  const [scale, setScale] = useState(1);
  
  // Mode states
  const [mode, setMode] = useState<'select' | 'move' | 'resize'>('select');
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);

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

    // Different behavior based on mode
    if (mode === 'select') {
      setIsSelecting(true);
      setSelectedTagId(null);
    } else if (mode === 'move' || mode === 'resize') {
      // Check if clicking on an existing tag
      const scaleFactor = pdfDimensions.width / containerRef.current.clientWidth;
      
      for (const tag of existingTags) {
        const tagLeft = tag.region.x / scaleFactor;
        const tagTop = tag.region.y / scaleFactor;
        const tagRight = tagLeft + tag.region.width / scaleFactor;
        const tagBottom = tagTop + tag.region.height / scaleFactor;

        // Check if click is inside tag
        if (x >= tagLeft && x <= tagRight && y >= tagTop && y <= tagBottom) {
          setSelectedTagId(tag.id);
          setIsSelecting(true);
          
          // For resize mode, determine which handle was clicked
          if (mode === 'resize') {
            const handleSize = 10;
            
            // Check corners
            if (Math.abs(x - tagLeft) < handleSize && Math.abs(y - tagTop) < handleSize) {
              setResizeHandle('top-left');
            } else if (Math.abs(x - tagRight) < handleSize && Math.abs(y - tagTop) < handleSize) {
              setResizeHandle('top-right');
            } else if (Math.abs(x - tagLeft) < handleSize && Math.abs(y - tagBottom) < handleSize) {
              setResizeHandle('bottom-left');
            } else if (Math.abs(x - tagRight) < handleSize && Math.abs(y - tagBottom) < handleSize) {
              setResizeHandle('bottom-right');
            }
            // Could add more handles for edges if needed
          }
          
          break;
        }
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isSelecting || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));

    setCurrentPos({ x, y });

    if (selectedTagId && onTagUpdated) {
      const scaleFactor = pdfDimensions.width / containerRef.current.clientWidth;
      const selectedTag = existingTags.find(tag => tag.id === selectedTagId);
      
      if (selectedTag) {
        if (mode === 'move') {
          // Calculate movement delta
          const deltaX = (x - startPos.x) * scaleFactor;
          const deltaY = (y - startPos.y) * scaleFactor;
          
          // Update tag position, but don't actually call onTagUpdated until mouse up
          const newRegion = {
            x: selectedTag.region.x + deltaX,
            y: selectedTag.region.y + deltaY,
            width: selectedTag.region.width,
            height: selectedTag.region.height
          };
          
          // Store the new position in startPos for continuous movement
          setStartPos({ x, y });
          
          onTagUpdated(selectedTagId, newRegion);
        } else if (mode === 'resize' && resizeHandle) {
          let newRegion = { ...selectedTag.region };
          const tagLeft = selectedTag.region.x / scaleFactor;
          const tagTop = selectedTag.region.y / scaleFactor;
          const tagRight = tagLeft + selectedTag.region.width / scaleFactor;
          const tagBottom = tagTop + selectedTag.region.height / scaleFactor;
          
          // Handle resizing based on which corner was grabbed
          switch (resizeHandle) {
            case 'top-left':
              newRegion = {
                x: selectedTag.region.x + (x - tagLeft) * scaleFactor,
                y: selectedTag.region.y + (y - tagTop) * scaleFactor,
                width: selectedTag.region.width - (x - tagLeft) * scaleFactor,
                height: selectedTag.region.height - (y - tagTop) * scaleFactor
              };
              break;
            case 'top-right':
              newRegion = {
                x: selectedTag.region.x,
                y: selectedTag.region.y + (y - tagTop) * scaleFactor,
                width: (x - tagLeft) * scaleFactor,
                height: selectedTag.region.height - (y - tagTop) * scaleFactor
              };
              break;
            case 'bottom-left':
              newRegion = {
                x: selectedTag.region.x + (x - tagLeft) * scaleFactor,
                y: selectedTag.region.y,
                width: selectedTag.region.width - (x - tagLeft) * scaleFactor,
                height: (y - tagTop) * scaleFactor
              };
              break;
            case 'bottom-right':
              newRegion = {
                x: selectedTag.region.x,
                y: selectedTag.region.y,
                width: (x - tagLeft) * scaleFactor,
                height: (y - tagTop) * scaleFactor
              };
              break;
          }
          
          // Ensure width and height are positive
          if (newRegion.width < 0) {
            newRegion.x = newRegion.x + newRegion.width;
            newRegion.width = Math.abs(newRegion.width);
          }
          
          if (newRegion.height < 0) {
            newRegion.y = newRegion.y + newRegion.height;
            newRegion.height = Math.abs(newRegion.height);
          }
          
          onTagUpdated(selectedTagId, newRegion);
        }
      }
    }
  };

  const handleMouseUp = () => {
    if (!isSelecting) return;
    
    // For selection mode, create a new tag
    if (mode === 'select' && !selectedTagId) {
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

      // Convert to PDF coordinates
      const scaleFactor = pdfDimensions.width / containerRef.current!.clientWidth;
      
      const region = {
        x: x * scaleFactor,
        y: y * scaleFactor,
        width: width * scaleFactor,
        height: height * scaleFactor
      };

      onRegionSelected(region);
    }
    
    setIsSelecting(false);
    setSelectedTagId(null);
    setResizeHandle(null);
  };

  const handleZoomIn = () => setScale(prev => Math.min(3, prev + 0.2));
  const handleZoomOut = () => setScale(prev => Math.max(0.4, prev - 0.2));
  const handleResetZoom = () => setScale(1);

  const selectionStyle = {
    left: Math.min(startPos.x, currentPos.x),
    top: Math.min(startPos.y, currentPos.y),
    width: Math.abs(currentPos.x - startPos.x),
    height: Math.abs(currentPos.y - startPos.y),
    display: isSelecting && !selectedTagId ? 'block' : 'none'
  };

  return (
    <Card className="w-full mb-6 overflow-hidden">
      <CardContent className="p-0 relative">
        <div className="bg-gray-100 p-2 flex justify-between items-center">
          <span className="font-medium truncate max-w-md">
            {document.name} (Page {currentPage})
          </span>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMode('select')}
              className={`p-1 ${mode === 'select' ? 'bg-blue-100' : ''}`}
              title="Select Mode"
            >
              Select
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMode('move')}
              className={`p-1 ${mode === 'move' ? 'bg-blue-100' : ''}`}
              title="Move Mode"
            >
              <Move className="h-4 w-4 mr-1" />
              Move
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMode('resize')}
              className={`p-1 ${mode === 'resize' ? 'bg-blue-100' : ''}`}
              title="Resize Mode"
            >
              Resize
            </Button>
            <div className="h-4 border-r border-gray-300"></div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomOut}
              className="p-1 rounded hover:bg-gray-200"
              title="Zoom Out"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <div className="flex items-center space-x-2">
              <span className="text-xs">{Math.round(scale * 100)}%</span>
              <div className="w-24">
                <Slider 
                  value={[scale * 100]} 
                  min={40} 
                  max={300} 
                  step={10} 
                  onValueChange={(values) => setScale(values[0] / 100)}
                />
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomIn}
              className="p-1 rounded hover:bg-gray-200"
              title="Zoom In"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetZoom}
              className="p-1 rounded hover:bg-gray-200"
              title="Reset Zoom"
            >
              Reset
            </Button>
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
            {existingTags.map((tag) => {
              const scaleFactor = pdfDimensions.width / (containerRef.current?.clientWidth || 1);
              const isSelected = selectedTagId === tag.id;
              
              return (
                <div
                  key={tag.id}
                  className={`absolute border-2 ${isSelected ? 'border-2 border-yellow-500' : ''} pointer-events-none`}
                  style={{
                    left: tag.region.x / scaleFactor,
                    top: tag.region.y / scaleFactor,
                    width: tag.region.width / scaleFactor,
                    height: tag.region.height / scaleFactor,
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
                  
                  {/* Resize handles - shown only for selected tag in resize mode */}
                  {isSelected && mode === 'resize' && (
                    <>
                      <div className="absolute w-2 h-2 bg-white border border-black cursor-nwse-resize -top-1 -left-1 z-10" />
                      <div className="absolute w-2 h-2 bg-white border border-black cursor-nesw-resize -top-1 -right-1 z-10" />
                      <div className="absolute w-2 h-2 bg-white border border-black cursor-nesw-resize -bottom-1 -left-1 z-10" />
                      <div className="absolute w-2 h-2 bg-white border border-black cursor-nwse-resize -bottom-1 -right-1 z-10" />
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PDFViewer;
