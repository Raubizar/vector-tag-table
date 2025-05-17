
import * as pdfjs from 'pdfjs-dist';
import type { TextItem } from 'pdfjs-dist/types/src/display/api';
import { TextElement } from '../types';
import { createPdfLoadingTask } from './core';
import { cloneArrayBuffer } from './safeBufferUtils';

/**
 * Extract raw text elements with position and styling information from a PDF page
 * @param data PDF ArrayBuffer data
 * @param pageNumber Page number to extract from (1-based index)
 * @returns Promise resolving to array of text elements with metadata
 */
export const extractTextElementsFromPage = async (
  data: ArrayBuffer,
  pageNumber: number
): Promise<TextElement[]> => {
  try {
    // Create a fresh copy of the ArrayBuffer to prevent it from being detached
    const safeData = cloneArrayBuffer(data);
    
    // Load PDF document using the shared loading task creator
    const loadingTask = createPdfLoadingTask(safeData);
    const pdf = await loadingTask.promise;
    
    // Get page
    const page = await pdf.getPage(pageNumber);
    
    // Extract text content with compatible options for PDF.js
    const textContent = await page.getTextContent({
      includeMarkedContent: true
      // Removed disableCombineTextItems as it's not compatible with the type
    });
    
    // Get page viewport (default scale = 1.0)
    const viewport = page.getViewport({ scale: 1.0 });
    
    // Process all text items and collect metadata
    const textElements: TextElement[] = [];
    
    for (const item of textContent.items) {
      const textItem = item as TextItem;
      
      if (!textItem.str) continue; // Skip items with no text
      
      const tx = textItem.transform;
      const fontSize = Math.sqrt((tx[2] * tx[2]) + (tx[3] * tx[3]));
      
      // Convert from PDF coordinates to viewport coordinates
      const x = tx[4]; 
      const y = viewport.height - tx[5]; // PDF coordinates start from bottom
      
      textElements.push({
        text: textItem.str,
        position: { 
          x,
          y 
        },
        width: textItem.width || 0,
        height: fontSize,
        fontSize: Math.round(fontSize),
        fontName: textItem.fontName || 'unknown'
      });
    }
    
    return textElements;
  } catch (error) {
    console.error('Error extracting text elements from page:', error);
    return [];
  }
};

/**
 * Get all text elements with their metadata from a PDF page
 * @param data PDF ArrayBuffer data
 * @param pageNumber Page number to get text elements from
 * @returns Promise resolving to array of text elements with metadata
 */
export const getTextElementsWithMetadata = async (
  data: ArrayBuffer,
  pageNumber: number
): Promise<TextElement[]> => {
  // Create a copy of the ArrayBuffer to prevent it from being detached
  const safeData = cloneArrayBuffer(data);
  return extractTextElementsFromPage(safeData, pageNumber);
};
