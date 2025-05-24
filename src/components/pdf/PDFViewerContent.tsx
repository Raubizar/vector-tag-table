
import React, { useRef, forwardRef } from 'react';
import { PDFDocument, Tag } from '@/lib/types';
import PDFCanvas from './PDFCanvas';
import PDFTagList from './PDFTagList';
import PDFSelectionBox from './PDFSelectionBox';
import PDFTextDebug from './PDFTextDebug';
import { InteractionMode } from '@/hooks/pdf/constants';
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
  onRegionSelected?: (region: Tag['region']) => void;
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
  onContainerInteraction,
  onRegionSelected
}, ref) => {
  const innerRef = useRef<HTMLDivElement>(null);
  const containerRefToUse = (ref || innerRef) as React.RefObject<HTMLDivElement>;
  
  // Use our text debug hook
  const [
    { isDebugActive, debugSettings },
    { toggleDebug, visualizeTextForCurrentPage }
  ] = usePdfTextDebug(document, currentPage, existingTags, selectedTagId);
  
  // For text selection mode, we don't attach mouse events directly to the container
  // as text selection is now handled by the text layer
  const containerEvents = mode === 'select' ? {} : {
    onMouseDown: onContainerInteraction,
    onMouseMove: onContainerInteraction,
    onMouseUp: onContainerInteraction,
    onMouseLeave: onContainerInteraction
  };

  return (
    <div
      ref={containerRefToUse}
      className="relative"
      {...containerEvents}
    >
      <PDFCanvas 
        document={document}
        currentPage={currentPage}
        scale={scale}
        onDimensionsChange={onDimensionsChange}
        autoZoom={true}
        onRegionSelected={onRegionSelected}
      />
      
      {/* Selection box overlay (only for non-text selection modes) */}
      {mode !== 'select' && (
        <PDFSelectionBox
          isSelecting={isSelecting}
          startPos={startPos}
          currentPos={currentPos}
          selectionPurpose={selectionPurpose}
        />
      )}
      
      {/* Render existing tags */}
      <PDFTagList
        tags={existingTags}
        containerRef={containerRefToUse}
        pdfDimensions={pdfDimensions}
        selectedTagId={selectedTagId}
        mode={mode}
      />
      
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
