import { PDFDocument, Tag, ExtractionResult, TextElement } from '../types';
import { extractTextElementsFromPage } from './textElement';
import { createPdfLoadingTask } from './core';
import extractionLogger from './extractionLogger';
import { cloneArrayBuffer, isArrayBufferDetached } from './safeBufferUtils';

/**
 * Process a single document for text extraction across all tags
 * @param document The PDF document to process
 * @param tags Array of tags to extract
 * @param pageNum Page number to extract from (default: 1)
 * @returns Array of extraction results
 */
export const processDocumentExtraction = async (
  document: PDFDocument,
  tags: Tag[],
  pageNum: number = 1
): Promise<ExtractionResult[]> => {
  const documentResults: ExtractionResult[] = [];
  
  extractionLogger.logStep('Processing document', { 
    documentName: document.name,
    documentId: document.id 
  });
  
  if (!document.data) {
    console.error(`Document ${document.name} has no data`);
    extractionLogger.logStep('Document skipped - no data', { documentName: document.name });
    
    // Add error results for this document
    return tags.map(tag => ({
      id: `${document.id}-${pageNum}-${tag.id}`,
      documentId: document.id,
      fileName: document.name,
      pageNumber: pageNum,
      tagId: tag.id,
      tagName: tag.name,
      extractedText: `[Error processing document: No data available]`,
      errorCode: 'NO_DATA'
    }));
  }
  
  try {
    // Check if buffer is detached and warn about it
    let documentData: ArrayBuffer;
    try {
      if (isArrayBufferDetached(document.data)) {
        console.warn(`Document data for ${document.name} was already detached`);
        extractionLogger.logStep('Document data was detached', { 
          documentName: document.name,
          action: 'Attempting to recover'
        });
      }
      
      // Always create a fresh copy for this document processing
      documentData = cloneArrayBuffer(document.data);
      
    } catch (err) {
      console.error(`Failed to clone buffer for ${document.name}, it might be detached:`, err);
      extractionLogger.logStep('Buffer cloning failed', { 
        documentName: document.name,
        error: err instanceof Error ? err.message : 'Unknown error'
      });
      
      // Add error result for this document
      return tags.map(tag => ({
        id: `${document.id}-${pageNum}-${tag.id}`,
        documentId: document.id,
        fileName: document.name,
        pageNumber: pageNum,
        tagId: tag.id, 
        tagName: tag.name,
        extractedText: `[Error processing document: Buffer was detached]`,
        errorCode: 'BUFFER_DETACHED'
      }));
    }
    
    extractionLogger.logStep('Extracting text elements from page', { 
      documentName: document.name,
      pageNumber: pageNum 
    });
    
    // Extract all text elements from the page once - this is more efficient
    // For each tag extraction, we must create a fresh copy of the buffer
    const clonedBufferForExtraction = cloneArrayBuffer(documentData);
    const allTextElements = await extractTextElementsFromPage(clonedBufferForExtraction, pageNum);
    
    extractionLogger.logStep('Text elements extracted', { 
      documentName: document.name,
      elementCount: allTextElements.length 
    });
    
    if (allTextElements.length === 0) {
      // No text elements found in the document
      extractionLogger.logStep('No text elements found in document', { 
        documentName: document.name,
        reason: 'May be scanned/image-based PDF' 
      });
      
      return tags.map(tag => ({
        id: `${document.id}-${pageNum}-${tag.id}`,
        documentId: document.id,
        fileName: document.name,
        pageNumber: pageNum,
        tagId: tag.id, 
        tagName: tag.name,
        extractedText: '[No text found in document - may be scanned/image-based PDF]',
        errorCode: 'NO_TEXT_CONTENT'
      }));
    }
    
    // Process each tag for this document
    for (const tag of tags) {
      const result = await processTagExtraction(document, tag, pageNum, allTextElements);
      documentResults.push(result);
    }
    
    return documentResults;
  } catch (error) {
    console.error(`Error processing document ${document.name}:`, error);
    
    extractionLogger.logStep('Error processing document', { 
      documentName: document.name,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined
    });
    
    // Add error result for this document
    return tags.map(tag => ({
      id: `${document.id}-${pageNum}-${tag.id}`,
      documentId: document.id,
      fileName: document.name,
      pageNumber: pageNum,
      tagId: tag.id, 
      tagName: tag.name,
      extractedText: `[Error processing document: ${error instanceof Error ? error.message : 'Unknown error'}]`,
      errorCode: 'PROCESSING_ERROR'
    }));
  }
};

/**
 * Process a single tag extraction from a document
 * @param document The PDF document
 * @param tag The tag to extract
 * @param pageNum Page number to extract from
 * @param allTextElements Already extracted text elements
 * @returns Extraction result
 */
export const processTagExtraction = async (
  document: PDFDocument,
  tag: Tag,
  pageNum: number,
  allTextElements: TextElement[]
): Promise<ExtractionResult> => {
  extractionLogger.logStep('Processing tag', { 
    tagName: tag.name,
    tagRegion: tag.region 
  });
  
  const resultId = `${document.id}-${pageNum}-${tag.id}`;
  
  // Filter text elements within the tag region
  const textElementsInRegion = allTextElements.filter(element => 
    element.position.x >= tag.region.x &&
    element.position.x <= (tag.region.x + tag.region.width) &&
    element.position.y >= tag.region.y &&
    element.position.y <= (tag.region.y + tag.region.height)
  );
  
  extractionLogger.logStep('Filtered text elements in region', { 
    tagName: tag.name,
    elementCount: textElementsInRegion.length,
    elements: textElementsInRegion.map(el => ({ 
      text: el.text,
      position: el.position
    }))
  });
  
  // Store extracted elements for debugging
  extractionLogger.storeExtractedElements(resultId, textElementsInRegion);
  
  if (textElementsInRegion.length === 0) {
    // No text found in this specific tag region
    extractionLogger.logStep('No text elements found in tag region', { 
      tagName: tag.name,
      errorCode: 'EMPTY_REGION'
    });
    
    return {
      id: resultId,
      documentId: document.id,
      fileName: document.name,
      pageNumber: pageNum,
      tagId: tag.id,
      tagName: tag.name,
      extractedText: '[No text found in this region]',
      textElements: [],
      errorCode: 'EMPTY_REGION'
    };
  }
  
  // Sort elements by position for proper reading order
  const sortedElements = [...textElementsInRegion].sort((a, b) => {
    // Group by approximate lines (using font height)
    const lineHeight = Math.max(a.height, b.height);
    const yThreshold = lineHeight * 0.5;
    
    if (Math.abs(a.position.y - b.position.y) <= yThreshold) {
      // Same line, sort by X
      return a.position.x - b.position.x;
    }
    // Different lines, sort by Y
    return a.position.y - b.position.y;
  });
  
  extractionLogger.logStep('Sorted text elements by position', { 
    tagName: tag.name,
    sortedCount: sortedElements.length
  });
  
  // Combine text with proper formatting
  let extractedText = '';
  let lastY: number | null = null;
  let lastElement: TextElement | null = null;
  
  for (const element of sortedElements) {
    if (lastY !== null && lastElement !== null) {
      const yDiff = Math.abs(element.position.y - lastY);
      const isNewLine = yDiff > element.height * 1.2;
      const isNewParagraph = yDiff > element.height * 2.5;
      
      if (isNewParagraph) {
        extractedText += '\n\n';
      } else if (isNewLine) {
        extractedText += '\n';
      } else {
        // Check if we need a space between elements on the same line
        const xDiff = element.position.x - (lastElement.position.x + lastElement.width);
        if (xDiff > element.width * 0.3) {
          extractedText += ' ';
        }
      }
    }
    
    extractedText += element.text;
    lastY = element.position.y;
    lastElement = element;
  }
  
  // Clean up the text
  extractedText = extractedText
    .replace(/\s+/g, ' ')         // Replace multiple spaces with a single space
    .replace(/(\n\s*){3,}/g, '\n\n') // Replace multiple consecutive line breaks with just two
    .trim();
  
  extractionLogger.logStep('Text assembled and cleaned', { 
    tagName: tag.name,
    textLength: extractedText.length,
    textPreview: extractedText.substring(0, 100) + (extractedText.length > 100 ? '...' : '')
  });
  
  return {
    id: resultId,
    documentId: document.id,
    fileName: document.name,
    pageNumber: pageNum,
    tagId: tag.id,
    tagName: tag.name,
    extractedText: extractedText || '[No text found]',
    textElements: sortedElements // Store the metadata for potential future use
  };
};
