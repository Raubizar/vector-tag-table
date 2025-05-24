
import * as pdfjs from 'pdfjs-dist';
import { TextElement } from '../types';
import { createPdfLoadingTask } from './core';
import { cloneArrayBuffer } from './safeBufferUtils';
import type { TextItem, TextMarkedContent } from 'pdfjs-dist/types/src/display/api';

/**
 * Creates a text layer div for text selection in PDFs
 * @param container Container element to append the text layer to
 * @param page PDF.js page object
 * @param viewport PDF.js viewport object
 * @returns HTMLDivElement containing the text layer
 */
export const createTextLayer = async (
  container: HTMLDivElement,
  page: pdfjs.PDFPageProxy,
  viewport: pdfjs.PageViewport
): Promise<HTMLDivElement> => {
  // Create text layer div
  const textLayerDiv = document.createElement('div');
  textLayerDiv.className = 'pdf-text-layer';
  textLayerDiv.style.position = 'absolute';
  textLayerDiv.style.left = '0';
  textLayerDiv.style.top = '0';
  textLayerDiv.style.right = '0';
  textLayerDiv.style.bottom = '0';
  textLayerDiv.style.overflow = 'hidden';
  textLayerDiv.style.opacity = '0.2'; // Make text layer slightly visible for debugging
  textLayerDiv.style.lineHeight = '1.0';
  textLayerDiv.style.userSelect = 'text';
  textLayerDiv.style.cursor = 'text';
  
  container.appendChild(textLayerDiv);

  // Get text content from page
  const textContent = await page.getTextContent();

  // Create text layer builder
  const renderParameters = {
    textContent,
    container: textLayerDiv,
    viewport,
    textDivs: []
  };

  // Since TextLayerBuilder and EventBus aren't available as direct imports, 
  // we'll use a more direct approach to render the text layer
  
  // We need to manually create and position text spans
  const textItems = textContent.items;
  const textDivs: HTMLSpanElement[] = [];
  
  for (let i = 0; i < textItems.length; i++) {
    const item = textItems[i];
    
    // Type guard to check if this item is a TextItem (not TextMarkedContent)
    if (!('str' in item) || !item.str || item.str.trim() === '') {
      continue;
    }
    
    // At this point TypeScript knows item is a TextItem with the str property
    const textItem = item as TextItem;
    
    // Create text span
    const textSpan = document.createElement('span');
    textSpan.textContent = textItem.str;
    
    // Position the span using the text item's transform
    const tx = textItem.transform;
    
    // Apply transform - these values come from the PDF and define
    // the position and scaling of each character
    const fontSize = Math.sqrt((tx[2] * tx[2]) + (tx[3] * tx[3]));
    
    if ('dir' in textItem && textItem.dir) {
      textSpan.dir = textItem.dir;
    }
    
    // Set style with transform
    textSpan.style.transform = `matrix(${tx[0]}, ${tx[1]}, ${tx[2]}, ${tx[3]}, ${tx[4]}, ${tx[5]})`;
    textSpan.style.left = '0px';
    textSpan.style.top = '0px';
    textSpan.style.fontFamily = 'fontName' in textItem ? textItem.fontName || 'sans-serif' : 'sans-serif';
    textSpan.style.fontSize = `${fontSize}px`;
    textSpan.style.position = 'absolute';
    
    // Add to container
    textLayerDiv.appendChild(textSpan);
    textDivs.push(textSpan);
  }
  
  return textLayerDiv;
};

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
  
  if (!selection || selection.rangeCount === 0) {
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
    x1: x1 / viewport.width,
    y1: y1 / viewport.height,
    x2: x2 / viewport.width,
    y2: y2 / viewport.height
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
 * @param textLayerDiv Text layer div element
 * @returns Selected text string
 */
export const getSelectedText = (): string => {
  const selection = window.getSelection();
  return selection ? selection.toString() : '';
};
