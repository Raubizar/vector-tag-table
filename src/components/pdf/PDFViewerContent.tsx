
import React, { useRef, forwardRef } from 'react';
import { PDFDocument, Tag } from '@/lib/types';
import PDFCanvas from './PDFCanvas';
import TagOverlay from './TagOverlay';
import PDFTextDebug from './PDFTextDebug';
import { InteractionMode } from '@/hooks/usePdfInteraction';
import usePdfTextDebug from '@/hooks/usePdfTextDebug';

interface PDFViewerContentProps {
  document: PDFDocument;
  currentPage: number;
  scale: number;
  pdfDimensions: { width: number; height: number };
  isSelecting: boolean;
  startPos: { x: number; y: number };
  currentPos: { x: number; y: number };
  mode: InteractionMode;
  selectionPurpose: 'tag' | 'zoom' | null;
  selectedTagId: string | null;
  existingTags: Tag[];
  onDimensionsChange: (dimensions: { width: number; height: number }) => void;
  onContainerInteraction: (event: React.MouseEvent) => void;
}

const PDFViewerContent = forwardRef<HTMLDivElement, PDFViewerContentProps>(({
  document,
  currentPage,
  scale,
  pdfDimensions,
  isSelecting,
  startPos,
  currentPos,
  mode,
  selectionPurpose,
  selectedTagId,
  existingTags,
  onDimensionsChange,
  onContainerInteraction
}, ref) => {
  const innerRef = useRef<HTMLDivElement>(null);
  const containerRefToUse = (ref || innerRef) as React.RefObject<HTMLDivElement>;
  
  // Use our new text debug hook
  const [
    { isDebugActive, debugSettings },
    { toggleDebug, visualizeTextForCurrentPage }
  ] = usePdfTextDebug(document, currentPage, existingTags, selectedTagId);
  
  const selectionStyle = {
    left: `${Math.min(startPos.x, currentPos.x)}px`,
    top: `${Math.min(startPos.y, currentPos.y)}px`,
    width: `${Math.abs(currentPos.x - startPos.x)}px`,
    height: `${Math.abs(currentPos.y - startPos.y)}px`,
    display: isSelecting ? 'block' : 'none',
    borderColor: selectionPurpose === 'zoom' ? 'rgba(50, 205, 50, 0.8)' : 'rgba(59, 130, 246, 0.8)',
    backgroundColor: selectionPurpose === 'zoom' ? 'rgba(50, 205, 50, 0.2)' : 'rgba(59, 130, 246, 0.2)'
  };

  return (
    <div
      ref={containerRefToUse}
      className="relative"
      onMouseDown={onContainerInteraction}
      onMouseMove={onContainerInteraction}
      onMouseUp={onContainerInteraction}
      onMouseLeave={onContainerInteraction}
    >
      <PDFCanvas 
        document={document}
        currentPage={currentPage}
        scale={scale}
        onDimensionsChange={onDimensionsChange}
        autoZoom={true}
      />
      
      {/* Selection box overlay */}
      <div
        className="absolute border-2 pointer-events-none"
        style={selectionStyle}
      />
      
      {/* Render existing tags */}
      {existingTags.map((tag) => {
        if (!containerRefToUse.current) return null;
        
        // Calculate proper scale factor based on rendered PDF size vs container size
        const scaleFactor = pdfDimensions.width / (containerRefToUse.current.clientWidth || 1);
        const isSelected = selectedTagId === tag.id;
        
        return (
          <TagOverlay
            key={tag.id}
            tag={tag}
            scaleFactor={scaleFactor}
            isSelected={isSelected}
            mode={mode}
          />
        );
      })}
      
      {/* Text debugging overlay */}
      <PDFTextDebug
        document={document}
        currentPage={currentPage}
        tags={existingTags}
        selectedTagId={selectedTagId}
        isDebugActive={isDebugActive}
        onToggleDebug={toggleDebug}
        onVisualize={visualizeTextForCurrentPage}
      />
    </div>
  );
});

PDFViewerContent.displayName = 'PDFViewerContent';

export default PDFViewerContent;
