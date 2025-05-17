
import { PDFDocument, Tag, ExtractionResult } from '../types';
import { extractTextFromRegion } from './textExtraction';

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
      
      for (const tag of tags) {
        const extractedText = await extractTextFromRegion(
          dataClone,
          pageNum,
          tag.region
        );
        
        documentResults.push({
          id: `${document.id}-${pageNum}-${tag.id}`,
          documentId: document.id,
          fileName: document.name,
          pageNumber: pageNum,
          tagId: tag.id,
          tagName: tag.name,
          extractedText: extractedText || '[No text found]'
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
