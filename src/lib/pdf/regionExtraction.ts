
import { Tag, TextExtractionDebugSettings, TextElement } from '../types';
import { extractTextElementsFromPage } from './textElement';
import { cloneArrayBuffer } from './safeBufferUtils';
import { filterElementsByRegion, formatTextElements } from './extractionUtils';

// Text processing options for extraction
export interface TextProcessingOptions {
  preserveFormatting?: boolean; // Keep paragraph breaks and indentation
  cleanupText?: boolean;        // Remove extra spaces, normalize whitespace
  ocrFallback?: boolean;        // Attempt OCR if text extraction fails
  debug?: boolean;              // Enable debug mode for visualization
}

/**
 * Extract text from a specific region of a PDF page
 * @param data PDF ArrayBuffer data
 * @param pageNumber Page number to extract from
 * @param region Region coordinates to extract text from
 * @param options Text processing options
 * @returns Promise resolving to extracted text
 */
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
    const elementsInRegion = filterElementsByRegion(textElements, region);
    
    if (elementsInRegion.length === 0) {
      // If no text found and OCR fallback is enabled
      if (options.ocrFallback) {
        return '[OCR processing would be applied here for scanned documents]';
      }
      return '';
    }
    
    let extractedText = '';
    
    if (options.preserveFormatting) {
      // Use the utility function for formatting text elements
      extractedText = formatTextElements(elementsInRegion);
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
