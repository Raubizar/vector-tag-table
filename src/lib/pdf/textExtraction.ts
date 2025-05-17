
import * as pdfjs from 'pdfjs-dist';
import type { TextItem } from 'pdfjs-dist/types/src/display/api';
import { Tag, PDFDocument, ExtractionResult } from '../types';
import { createPdfLoadingTask } from './core';

// Text processing options for extraction
export interface TextProcessingOptions {
  preserveFormatting?: boolean; // Keep paragraph breaks and indentation
  cleanupText?: boolean;        // Remove extra spaces, normalize whitespace
  ocrFallback?: boolean;        // Attempt OCR if text extraction fails
}

export const extractTextFromRegion = async (
  data: ArrayBuffer,
  pageNumber: number,
  region: Tag['region'],
  options: TextProcessingOptions = { preserveFormatting: true, cleanupText: true, ocrFallback: true }
): Promise<string> => {
  try {
    // Load PDF document using the shared loading task creator
    const loadingTask = createPdfLoadingTask(data);
    const pdf = await loadingTask.promise;
    
    // Get page
    const page = await pdf.getPage(pageNumber);
    
    // Extract text content with compatible options for PDF.js
    const textContent = await page.getTextContent();
    
    // Get page viewport (default scale = 1.0)
    const viewport = page.getViewport({ scale: 1.0 });
    
    // Track formatting information
    let lastY: number | null = null;
    let lastX = 0;
    let extractedText = '';
    let lineTexts: { text: string, x: number }[] = [];
    
    // Process all text items in the region
    for (const item of textContent.items) {
      const textItem = item as TextItem;
      const tx = textItem.transform;
      const textX = tx[4]; // x position
      const textY = viewport.height - tx[5]; // y position (PDF coordinates start from bottom)
      
      // Check if text is inside region
      if (
        textX >= region.x &&
        textX <= region.x + region.width &&
        textY >= region.y &&
        textY <= region.y + region.height
      ) {
        // Handle formatting if preserveFormatting is enabled
        if (options.preserveFormatting) {
          // Detect new line (significant Y position change)
          const isNewLine = lastY !== null && Math.abs(textY - lastY) > textItem.height * 1.2;
          
          // Detect if this is a new paragraph (significant Y gap)
          const isNewParagraph = lastY !== null && Math.abs(textY - lastY) > textItem.height * 2.5;
          
          // Handle line breaks and paragraph formatting
          if (isNewParagraph) {
            // Sort line by x position before adding to text
            lineTexts.sort((a, b) => a.x - b.x);
            extractedText += lineTexts.map(l => l.text).join(' ').trim() + '\n\n';
            lineTexts = [];
          } else if (isNewLine) {
            // Sort line by x position before adding to text
            lineTexts.sort((a, b) => a.x - b.x);
            extractedText += lineTexts.map(l => l.text).join(' ').trim() + '\n';
            lineTexts = [];
          }
          
          // If it's a special character at beginning of line (bullet point, etc)
          const isBulletPoint = textItem.str.trim() === '•' || textItem.str.trim() === '-' || textItem.str.trim() === '*';
          if (isBulletPoint && lineTexts.length === 0) {
            lineTexts.push({ text: textItem.str, x: textX });
          } else {
            // Add to current line considering spacing
            const isSpaceNeeded = lastX > 0 && (textX - lastX > textItem.width * 0.5);
            lineTexts.push({ 
              text: (isSpaceNeeded ? ' ' : '') + textItem.str,
              x: textX
            });
          }
          
          lastY = textY;
          lastX = textX + textItem.width;
        } else {
          // Simple extraction without formatting
          extractedText += textItem.str + ' ';
        }
      }
    }
    
    // Add any remaining text in the current line
    if (options.preserveFormatting && lineTexts.length > 0) {
      lineTexts.sort((a, b) => a.x - b.x);
      extractedText += lineTexts.map(l => l.text).join(' ').trim();
    }
    
    // Clean up the extracted text if requested
    if (options.cleanupText) {
      extractedText = extractedText
        .replace(/\s+/g, ' ')         // Replace multiple spaces with a single space
        .replace(/(\n\s*){3,}/g, '\n\n') // Replace multiple consecutive line breaks with just two
        .trim();                      // Remove leading/trailing whitespace
    }
    
    if (extractedText.trim().length === 0 && options.ocrFallback) {
      // OCR fallback would be implemented here if text extraction fails
      // This would require integrating with a third-party OCR service
      return '[OCR processing would be applied here for scanned documents]';
    }
    
    return extractedText.trim();
  } catch (error) {
    console.error('Error extracting text from region:', error);
    return '[Error extracting text]';
  }
};
