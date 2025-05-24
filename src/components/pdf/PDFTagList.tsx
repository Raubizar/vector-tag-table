
import React from 'react';
import { Tag } from '@/lib/types';
import TagOverlay from './TagOverlay';
import { InteractionMode } from '@/hooks/pdf/constants';

interface PDFTagListProps {
  tags: Tag[];
  containerRef: React.RefObject<HTMLDivElement>;
  pdfDimensions: { width: number; height: number };
  selectedTagId: string | null;
  mode: InteractionMode;
}

const PDFTagList: React.FC<PDFTagListProps> = ({
  tags,
  containerRef,
  pdfDimensions,
  selectedTagId,
  mode
}) => {
  return (
    <>
      {tags.map((tag) => {
        if (!containerRef.current) return null;
        
        // Calculate proper scale factor based on rendered PDF size vs container size
        const scaleFactor = pdfDimensions.width / (containerRef.current.clientWidth || 1);
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
    </>
  );
};

export default PDFTagList;
