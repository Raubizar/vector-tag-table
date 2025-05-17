import * as pdfjs from 'pdfjs-dist';
import type { TextItem } from 'pdfjs-dist/types/src/display/api';
import { Tag, PDFDocument, ExtractionResult, TextElement } from '../types';
import { createPdfLoadingTask } from './core';
import { cloneArrayBuffer } from './safeBufferUtils';

// Text processing options for extraction
export interface TextProcessingOptions {
  preserveFormatting?: boolean; // Keep paragraph breaks and indentation
  cleanupText?: boolean;        // Remove extra spaces, normalize whitespace
  ocrFallback?: boolean;        // Attempt OCR if text extraction fails
  debug?: boolean;              // Enable debug mode for visualization
}

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

export const extractTextFromRegion = async (
  data: ArrayBuffer,
  pageNumber: number,
  region: Tag['region'],
  options: TextProcessingOptions = { preserveFormatting: true, cleanupText: true, ocrFallback: true }
): Promise<string> => {
  try {
    // Create a fresh copy of the ArrayBuffer to prevent it from being detached
    const safeData = cloneArrayBuffer(data);
    
    // First extract all text elements from the page
    const textElements = await extractTextElementsFromPage(safeData, pageNumber);
    
    // Filter text elements that are inside the region
    const elementsInRegion = textElements.filter(element => 
      element.position.x >= region.x &&
      element.position.x <= (region.x + region.width) &&
      element.position.y >= region.y &&
      element.position.y <= (region.y + region.height)
    );
    
    if (elementsInRegion.length === 0) {
      // If no text found and OCR fallback is enabled
      if (options.ocrFallback) {
        return '[OCR processing would be applied here for scanned documents]';
      }
      return '';
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
    return '[Error extracting text: ' + (error instanceof Error ? error.message : 'Unknown error') + ']';
  }
};

// Export a function to get all text elements with their metadata
export const getTextElementsWithMetadata = async (
  data: ArrayBuffer,
  pageNumber: number
): Promise<TextElement[]> => {
  // Create a copy of the ArrayBuffer to prevent it from being detached
  const safeData = cloneArrayBuffer(data);
  return extractTextElementsFromPage(safeData, pageNumber);
};

// Visualize text elements on a canvas for debugging
export const visualizeTextElements = async (
  canvas: HTMLCanvasElement,
  data: ArrayBuffer,
  pageNumber: number,
  selectedTagId?: string,
  tags?: Tag[]
): Promise<void> => {
  try {
    const safeData = cloneArrayBuffer(data);
    const textElements = await extractTextElementsFromPage(safeData, pageNumber);
    
    if (!canvas || textElements.length === 0) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw text element boxes
    textElements.forEach((element) => {
      ctx.strokeStyle = 'rgba(0, 128, 255, 0.5)';
      ctx.lineWidth = 1;
      
      // Check if this text element is within any tag's region
      let isInSelectedTag = false;
      
      if (tags && selectedTagId) {
        const selectedTag = tags.find(tag => tag.id === selectedTagId);
        if (selectedTag) {
          const { x, y, width, height } = selectedTag.region;
          isInSelectedTag = (
            element.position.x >= x &&
            element.position.x <= (x + width) &&
            element.position.y >= y &&
            element.position.y <= (y + height)
          );
        }
      }
      
      // Highlight text elements in the selected tag
      if (isInSelectedTag) {
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.8)';
        ctx.lineWidth = 2;
      }
      
      ctx.strokeRect(
        element.position.x,
        element.position.y,
        element.width,
        element.height
      );
      
      // Add text label (optional)
      if (isInSelectedTag) {
        ctx.font = '10px Arial';
        ctx.fillStyle = 'rgba(255, 215, 0, 0.8)';
        ctx.fillText(
          element.text,
          element.position.x,
          element.position.y - 2
        );
      }
    });
  } catch (error) {
    console.error('Error visualizing text elements:', error);
  }
};
