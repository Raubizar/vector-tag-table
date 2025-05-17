
import * as pdfjs from 'pdfjs-dist';
import type { TextItem } from 'pdfjs-dist/types/src/display/api';
import { Tag, PDFDocument, ExtractionResult, TextElement } from '../types';
import { createPdfLoadingTask } from './core';

// Text processing options for extraction
export interface TextProcessingOptions {
  preserveFormatting?: boolean; // Keep paragraph breaks and indentation
  cleanupText?: boolean;        // Remove extra spaces, normalize whitespace
  ocrFallback?: boolean;        // Attempt OCR if text extraction fails
}

export const extractTextElementsFromPage = async (
  data: ArrayBuffer,
  pageNumber: number
): Promise<TextElement[]> => {
  try {
    // Load PDF document using the shared loading task creator
    const loadingTask = createPdfLoadingTask(data);
    const pdf = await loadingTask.promise;
    
    // Get page
    const page = await pdf.getPage(pageNumber);
    
    // Extract text content with compatible options for PDF.js
    const textContent = await page.getTextContent({
      includeMarkedContent: true
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

export const extractTextFromRegion = async (
  data: ArrayBuffer,
  pageNumber: number,
  region: Tag['region'],
  options: TextProcessingOptions = { preserveFormatting: true, cleanupText: true, ocrFallback: true }
): Promise<string> => {
  try {
    // First extract all text elements from the page
    const textElements = await extractTextElementsFromPage(data, pageNumber);
    
    // Filter text elements that are inside the region
    const elementsInRegion = textElements.filter(element => 
      element.position.x >= region.x &&
      element.position.x <= (region.x + region.width) &&
      element.position.y >= region.y &&
      element.position.y <= (region.y + region.height)
    );
    
    if (elementsInRegion.length === 0) {
      return options.ocrFallback ? '[OCR processing would be applied here for scanned documents]' : '';
    }
    
    // Sort elements by Y position (top to bottom) then X position (left to right)
    elementsInRegion.sort((a, b) => {
      // Group elements by lines (elements within ~same Y coordinate)
      const lineHeight = Math.max(a.height, b.height);
      const yThreshold = lineHeight * 0.5;
      
      if (Math.abs(a.position.y - b.position.y) <= yThreshold) {
        // Same line, sort by X position
        return a.position.x - b.position.x;
      }
      
      // Different lines, sort by Y position
      return a.position.y - b.position.y;
    });
    
    // Format and combine the text based on options
    let extractedText = '';
    let lastY: number | null = null;
    let lastX = 0;
    
    if (options.preserveFormatting) {
      elementsInRegion.forEach(element => {
        // Check if this is a new line based on Y position change
        if (lastY !== null) {
          const yDiff = Math.abs(element.position.y - lastY);
          const isNewLine = yDiff > element.height * 1.2;
          const isNewParagraph = yDiff > element.height * 2.5;
          
          if (isNewParagraph) {
            extractedText += '\n\n';
          } else if (isNewLine) {
            extractedText += '\n';
          } else {
            // Check if we need a space between elements on the same line
            const xDiff = element.position.x - lastX;
            if (xDiff > element.width * 0.3) {
              extractedText += ' ';
            }
          }
        }
        
        extractedText += element.text;
        lastY = element.position.y;
        lastX = element.position.x + element.width;
      });
    } else {
      // Simple concatenation with spaces
      extractedText = elementsInRegion.map(el => el.text).join(' ');
    }
    
    // Clean up the extracted text if requested
    if (options.cleanupText) {
      extractedText = extractedText
        .replace(/\s+/g, ' ')         // Replace multiple spaces with a single space
        .replace(/(\n\s*){3,}/g, '\n\n') // Replace multiple consecutive line breaks with just two
        .trim();                      // Remove leading/trailing whitespace
    }
    
    return extractedText.trim();
  } catch (error) {
    console.error('Error extracting text from region:', error);
    return '[Error extracting text]';
  }
};

// Export a function to get all text elements with their metadata
export const getTextElementsWithMetadata = async (
  data: ArrayBuffer,
  pageNumber: number
): Promise<TextElement[]> => {
  return extractTextElementsFromPage(data, pageNumber);
};
