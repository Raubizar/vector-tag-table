
import { PDFDocument, Tag, ExtractionResult } from '../types';
import extractionLogger from './extractionLogger';
import { processDocumentExtraction } from './extractionProcessor';
import { validateDocumentData } from './documentAnalyzer';

/**
 * Extract text from all documents using the specified tags
 * @param documents Array of PDF documents to process
 * @param tags Array of tags to extract
 * @returns Promise resolving to array of extraction results
 */
export const extractTextFromAllDocuments = async (
  documents: PDFDocument[],
  tags: Tag[]
): Promise<ExtractionResult[]> => {
  const results: ExtractionResult[] = [];
  
  // Start the extraction process logging
  extractionLogger.startExtraction();
  extractionLogger.logStep('Beginning batch extraction', { 
    documentCount: documents.length,
    tagCount: tags.length 
  });
  
  // Process each document
  for (const document of documents) {
    // Validate document data
    const validation = validateDocumentData(document);
    if (!validation.isValid) {
      console.error(`Document ${document.name}: ${validation.errorMessage}`);
      extractionLogger.logStep('Document validation failed', { 
        documentName: document.name, 
        error: validation.errorMessage 
      });
      
      // Add error results for this document
      for (const tag of tags) {
        results.push({
          id: `${document.id}-1-${tag.id}`,
          documentId: document.id,
          fileName: document.name,
          pageNumber: 1,
          tagId: tag.id, 
          tagName: tag.name,
          extractedText: `[Error: ${validation.errorMessage}]`,
          errorCode: validation.errorCode
        });
      }
      
      continue;
    }
    
    // Only process the first page of each document
    const pageNum = 1;
    
    try {
      // Process document and add results
      const documentResults = await processDocumentExtraction(document, tags, pageNum);
      results.push(...documentResults);
    } catch (error) {
      console.error(`Error in batch processing for document ${document.name}:`, error);
      
      // Add error result for this document
      for (const tag of tags) {
        results.push({
          id: `${document.id}-${pageNum}-${tag.id}`,
          documentId: document.id,
          fileName: document.name,
          pageNumber: pageNum,
          tagId: tag.id, 
          tagName: tag.name,
          extractedText: `[Error processing document: ${error instanceof Error ? error.message : 'Unknown error'}]`,
          errorCode: 'BATCH_PROCESSING_ERROR'
        });
      }
    }
  }
  
  extractionLogger.logStep('Extraction complete', { resultCount: results.length });
  extractionLogger.finishExtraction();
  
  return results;
};

// Re-export the isProbablyScannedPdf function from documentAnalyzer
export { isProbablyScannedPdf } from './documentAnalyzer';
