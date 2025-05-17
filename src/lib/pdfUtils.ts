
import * as pdfjs from 'pdfjs-dist';
import { PDFDocument, Tag, ExtractionResult } from './types';

// Initialize PDF.js worker
const pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.mjs');
pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

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
  
  // Load PDF document
  const loadingTask = pdfjs.getDocument({ data });
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
  // Load PDF document
  const loadingTask = pdfjs.getDocument({ data });
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
    const textItem = item as pdfjs.TextItem;
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
    
    // Load PDF document
    const loadingTask = pdfjs.getDocument({ data: document.data });
    const pdf = await loadingTask.promise;
    
    // Process all pages
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      // For each tag, extract text from the defined region
      for (const tag of tags) {
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
  }
  
  return results;
};
