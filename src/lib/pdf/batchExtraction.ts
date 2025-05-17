
import { PDFDocument, Tag, ExtractionResult, TextElement } from '../types';
import { extractTextFromRegion, extractTextElementsFromPage } from './textExtraction';

export const extractTextFromAllDocuments = async (
  documents: PDFDocument[],
  tags: Tag[]
): Promise<ExtractionResult[]> => {
  const results: ExtractionResult[] = [];
  
  for (const document of documents) {
    if (!document.data) continue;
    
    // Only process the first page of each document
    const pageNum = 1;
    
    try {
      // Process all tags for this document
      const documentResults: ExtractionResult[] = [];
      
      // Create a copy of the ArrayBuffer to prevent it from being detached
      const dataClone = new Uint8Array(document.data).buffer;
      
      // Extract all text elements from the page once - this is more efficient
      const allTextElements = await extractTextElementsFromPage(dataClone, pageNum);
      
      for (const tag of tags) {
        // Filter text elements within the tag region
        const textElementsInRegion = allTextElements.filter(element => 
          element.position.x >= tag.region.x &&
          element.position.x <= (tag.region.x + tag.region.width) &&
          element.position.y >= tag.region.y &&
          element.position.y <= (tag.region.y + tag.region.height)
        );
        
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
        
        documentResults.push({
          id: `${document.id}-${pageNum}-${tag.id}`,
          documentId: document.id,
          fileName: document.name,
          pageNumber: pageNum,
          tagId: tag.id,
          tagName: tag.name,
          extractedText: extractedText || '[No text found]',
          textElements: sortedElements // Store the metadata for potential future use
        });
      }
      
      results.push(...documentResults);
    } catch (error) {
      console.error(`Error processing document ${document.name}:`, error);
      // Add error result for this document
      for (const tag of tags) {
        results.push({
          id: `${document.id}-${pageNum}-${tag.id}`,
          documentId: document.id,
          fileName: document.name,
          pageNumber: pageNum,
          tagId: tag.id, 
          tagName: tag.name,
          extractedText: '[Error processing document]'
        });
      }
    }
  }
  
  return results;
};
