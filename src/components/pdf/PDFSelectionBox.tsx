
import React from 'react';

interface PDFSelectionBoxProps {
  isSelecting: boolean;
  startPos: { x: number; y: number };
  currentPos: { x: number; y: number };
  selectionPurpose: 'tag' | 'zoom' | null;
}

const PDFSelectionBox: React.FC<PDFSelectionBoxProps> = ({
  isSelecting,
  startPos,
  currentPos,
  selectionPurpose
}) => {
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
      className="absolute border-2 pointer-events-none"
      style={selectionStyle}
    />
  );
};

export default PDFSelectionBox;
