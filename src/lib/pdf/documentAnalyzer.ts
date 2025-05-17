
import { PDFDocument } from '../types';
import { createPdfLoadingTask } from './core';
import { cloneArrayBuffer } from './safeBufferUtils';

/**
 * Helper function to check if a PDF is likely to be scanned/image-based
 * @param data PDF ArrayBuffer data
 * @returns Promise resolving to true if PDF is likely scanned
 */
export const isProbablyScannedPdf = async (data: ArrayBuffer): Promise<boolean> => {
  try {
    const safeData = cloneArrayBuffer(data);
    const loadingTask = createPdfLoadingTask(safeData);
    const pdf = await loadingTask.promise;
    
    // Get first page
    const page = await pdf.getPage(1);
    
    // Extract text content
    const textContent = await page.getTextContent();
    
    // If there are very few text items, it's likely a scanned document
    return textContent.items.length < 5;
  } catch (error) {
    console.error('Error checking if PDF is scanned:', error);
    return false;
  }
};

/**
 * Validate document data to ensure it's ready for extraction
 * @param document The PDF document to validate
 * @returns An object with validation result and error message if any
 */
export const validateDocumentData = (document: PDFDocument): { 
  isValid: boolean; 
  errorMessage?: string; 
  errorCode?: string;
} => {
  if (!document) {
    return { 
      isValid: false, 
      errorMessage: 'Document is undefined', 
      errorCode: 'INVALID_DOCUMENT' 
    };
  }
  
  if (!document.data) {
    return { 
      isValid: false, 
      errorMessage: 'Document has no data', 
      errorCode: 'NO_DATA' 
    };
  }
  
  try {
    if (isArrayBufferDetached(document.data)) {
      return { 
        isValid: false, 
        errorMessage: 'Document data is detached', 
        errorCode: 'BUFFER_DETACHED' 
      };
    }
  } catch (err) {
    return { 
      isValid: false, 
      errorMessage: 'Error checking document data', 
      errorCode: 'VALIDATION_ERROR' 
    };
  }
  
  return { isValid: true };
};

/**
 * Check if an ArrayBuffer is detached
 * @param buffer ArrayBuffer to check
 * @returns true if detached, false otherwise
 */
function isArrayBufferDetached(buffer: ArrayBuffer): boolean {
  try {
    // Try to create a view - this will fail if the buffer is detached
    new Uint8Array(buffer, 0, 1);
    return false;
  } catch (e) {
    return true;
  }
}
