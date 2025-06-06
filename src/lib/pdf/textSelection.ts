
import * as pdfjs from 'pdfjs-dist';

/**
 * Get the current text selection as a PDF coordinate rectangle
 * @param textLayerDiv Text layer div element
 * @param viewport PDF.js viewport object
 * @returns Rectangle coordinates in PDF space and normalized coordinates (0-1)
 */
export const getTextSelectionRect = (
  textLayerDiv: HTMLDivElement,
  viewport: pdfjs.PageViewport
): { 
  pdfCoords: { x1: number, y1: number, x2: number, y2: number },
  normalizedCoords: { x1: number, y1: number, x2: number, y2: number }
} | null => {
  // Get the current selection
  const selection = window.getSelection();
  
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
    return null;
  }
  
  // Get bounding rectangle of the selection
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  
  if (!rect || rect.width === 0 || rect.height === 0) {
    return null;
  }
  
  // Get text layer position
  const textLayerRect = textLayerDiv.getBoundingClientRect();
  
  // Calculate selection position relative to the text layer
  const x1 = rect.left - textLayerRect.left;
  const y1 = rect.top - textLayerRect.top;
  const x2 = rect.right - textLayerRect.left;
  const y2 = rect.bottom - textLayerRect.top;
  
  // Convert to PDF coordinates
  // PDF.js coordinate system starts from bottom-left
  // need to convert screen points to PDF points
  const pdfPoint1 = viewport.convertToPdfPoint(x1, y1);
  const pdfPoint2 = viewport.convertToPdfPoint(x2, y2);
  
  // Get normalized coordinates (0-1) based on viewport dimensions
  const normalizedCoords = {
    x1: pdfPoint1[0] / viewport.width,
    y1: pdfPoint1[1] / viewport.height,
    x2: pdfPoint2[0] / viewport.width,
    y2: pdfPoint2[1] / viewport.height
  };
  
  return {
    // PDF coordinates
    pdfCoords: {
      x1: pdfPoint1[0],
      y1: pdfPoint1[1],
      x2: pdfPoint2[0],
      y2: pdfPoint2[1]
    },
    // Normalized coordinates (0-1)
    normalizedCoords
  };
};

/**
 * Extract text from the current text selection
 * @returns Selected text string
 */
export const getSelectedText = (): string => {
  const selection = window.getSelection();
  return selection ? selection.toString() : '';
};
