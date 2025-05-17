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
  
  try {
    // Create a copy of the ArrayBuffer to prevent it from being detached
    const dataClone = new Uint8Array(data).buffer;
    
    // Load PDF document with higher memory limits for large PDFs
    const loadingTask = pdfjs.getDocument({
      data: dataClone,
      cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
      cMapPacked: true,
      // Increase memory to handle larger PDFs (A0/A1 size)
      maxImageSize: 100 * 1024 * 1024, // 100MB
      isEvalSupported: false,
      disableFontFace: false,
    });
    
    // Set longer timeout for large documents
    loadingTask.onPassword = () => {}; // Empty handler to avoid password prompts
    
    const pdf = await loadingTask.promise;
    
    // Get page
    const page = await pdf.getPage(pageNumber);
    
    // Calculate viewport
    const viewport = page.getViewport({ scale });
    
    // Create canvas using the browser's document object
    const canvas = window.document.createElement('canvas');
    const context = canvas.getContext('2d', { alpha: false });
    
    if (!context) {
      throw new Error('Failed to get canvas context');
    }
    
    // Set dimensions with a maximum size to prevent browser limitations
    const maxSize = 16384; // Maximum canvas size in most browsers
    
    // Check if viewport dimensions are too large
    if (viewport.width > maxSize || viewport.height > maxSize) {
      console.warn(`PDF page size (${viewport.width}x${viewport.height}) exceeds maximum canvas size. Scaling down.`);
      const scaleFactor = Math.min(
        maxSize / viewport.width,
        maxSize / viewport.height
      );
      
      const adjustedViewport = page.getViewport({ scale: scale * scaleFactor });
      canvas.width = adjustedViewport.width;
      canvas.height = adjustedViewport.height;
      canvas.style.width = '100%';
      canvas.style.height = 'auto';
      
      // Render PDF page to canvas
      const renderContext = {
        canvasContext: context,
        viewport: adjustedViewport,
        enableWebGL: true
      };
      
      await page.render(renderContext).promise;
      
      container.appendChild(canvas);
      
      return {
        width: viewport.width, // Return original dimensions for proper scaling
        height: viewport.height
      };
    } else {
      // Standard rendering for normal sized PDFs
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      canvas.style.width = '100%';
      canvas.style.height = 'auto';
      
      // Render PDF page to canvas
      const renderContext = {
        canvasContext: context,
        viewport,
        enableWebGL: true
      };
      
      await page.render(renderContext).promise;
      
      container.appendChild(canvas);
      
      return {
        width: viewport.width,
        height: viewport.height
      };
    }
  } catch (error) {
    console.error('Error rendering PDF:', error);
    
    // Create error message element
    const errorMessage = document.createElement('div');
    errorMessage.className = 'bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative';
    errorMessage.style.width = '100%';
    errorMessage.style.minHeight = '200px';
    errorMessage.style.display = 'flex';
    errorMessage.style.justifyContent = 'center';
    errorMessage.style.alignItems = 'center';
    errorMessage.innerHTML = `<p>Error rendering PDF. Try selecting a smaller area to zoom or reducing the zoom level.</p>`;
    
    container.appendChild(errorMessage);
    
    return {
      width: 800, // Default fallback width
      height: 600  // Default fallback height
    };
  }
};

export const extractTextFromRegion = async (
  data: ArrayBuffer,
  pageNumber: number,
  region: Tag['region']
): Promise<string> => {
  try {
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
  } catch (error) {
    console.error('Error extracting text from region:', error);
    return '[Error extracting text]';
  }
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
      // Process all tags for this document
      const documentResults: ExtractionResult[] = [];
      
      // Create a copy of the ArrayBuffer to prevent it from being detached
      const dataClone = new Uint8Array(document.data).buffer;
      
      // Load PDF document
      const loadingTask = pdfjs.getDocument({ data: dataClone });
      const pdf = await loadingTask.promise;
      
      if (pageNum <= pdf.numPages) {
        for (const tag of tags) {
          const extractedText = await extractTextFromRegion(
            document.data,
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
