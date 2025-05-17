
import * as pdfjs from 'pdfjs-dist';
import type { TextItem } from 'pdfjs-dist/types/src/display/api';
import { PDFDocument, Tag, ExtractionResult } from './types';

// Initialize PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';

export const loadPdfDocument = async (file: File): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result instanceof ArrayBuffer) {
        resolve(event.target.result);
      } else {
        reject(new Error("Failed to read PDF file as ArrayBuffer"));
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};

export const renderPdfPage = async (
  container: HTMLDivElement,
  data: ArrayBuffer,
  pageNumber = 1,
  scale = 1.0
): Promise<{ width: number; height: number }> => {
  // Clear container
  container.innerHTML = '';
  
  // Create a copy of the ArrayBuffer to prevent it from being detached
  const dataClone = new Uint8Array(data).buffer;
  
  // Load PDF document
  const loadingTask = pdfjs.getDocument({ data: dataClone });
  const pdf = await loadingTask.promise;
  
  // Get page
  const page = await pdf.getPage(pageNumber);
  
  // Calculate viewport
  const viewport = page.getViewport({ scale });
  
  // Create canvas
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  
  if (!context) {
    throw new Error('Failed to get canvas context');
  }
  
  canvas.height = viewport.height;
  canvas.width = viewport.width;
  canvas.style.width = '100%';
  canvas.style.height = 'auto';
  
  // Render PDF page to canvas
  const renderContext = {
    canvasContext: context,
    viewport
  };
  
  await page.render(renderContext).promise;
  
  container.appendChild(canvas);
  
  return {
    width: viewport.width,
    height: viewport.height
  };
};

export const extractTextFromRegion = async (
  data: ArrayBuffer,
  pageNumber: number,
  region: Tag['region']
): Promise<string> => {
  // Create a copy of the ArrayBuffer to prevent it from being detached
  const dataClone = new Uint8Array(data).buffer;
  
  // Load PDF document
  const loadingTask = pdfjs.getDocument({ data: dataClone });
  const pdf = await loadingTask.promise;
  
  // Get page
  const page = await pdf.getPage(pageNumber);
  
  // Extract text content
  const textContent = await page.getTextContent();
  
  // Get page viewport (default scale = 1.0)
  const viewport = page.getViewport({ scale: 1.0 });
  
  // Filter text based on region
  let extractedText = '';
  
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
      extractedText += textItem.str + ' ';
    }
  }
  
  return extractedText.trim();
};

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
      // Create a copy of the ArrayBuffer to prevent it from being detached
      const dataClone = new Uint8Array(document.data).buffer;
      
      // Load PDF document
      const loadingTask = pdfjs.getDocument({ data: dataClone });
      const pdf = await loadingTask.promise;
      
      // For each tag, extract text from the defined region
      for (const tag of tags) {
        if (pageNum <= pdf.numPages) { // Make sure the document has at least one page
          const extractedText = await extractTextFromRegion(
            document.data,
            pageNum,
            tag.region
          );
          
          if (extractedText) {
            results.push({
              id: `${document.id}-${pageNum}-${tag.id}`,
              documentId: document.id,
              fileName: document.name,
              pageNumber: pageNum,
              tagId: tag.id,
              tagName: tag.name,
              extractedText
            });
          }
        }
      }
    } catch (error) {
      console.error(`Error processing document ${document.name}:`, error);
      // Continue with next document rather than failing the entire batch
    }
  }
  
  return results;
};
