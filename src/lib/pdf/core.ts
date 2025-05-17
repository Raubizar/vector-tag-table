
import * as pdfjs from 'pdfjs-dist';
import { cloneArrayBuffer } from './safeBufferUtils';

// Initialize PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';

export const loadPdfDocument = async (file: File): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result instanceof ArrayBuffer) {
        // Return a clone of the buffer to prevent detachment
        const safeBuffer = cloneArrayBuffer(event.target.result);
        resolve(safeBuffer);
      } else {
        reject(new Error("Failed to read PDF file as ArrayBuffer"));
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};

// Helper function to create a PDF loading task with optimized settings
export const createPdfLoadingTask = (data: ArrayBuffer, enableProgressiveLoading: boolean = false) => {
  // Create a copy of the ArrayBuffer to prevent it from being detached
  // This is critical as PDF.js will detach the buffer during processing
  const dataClone = cloneArrayBuffer(data);
  
  // Enhanced options for handling large format PDFs
  return pdfjs.getDocument({
    data: dataClone,
    cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
    cMapPacked: true,
    // Increased memory limits for large PDFs (A0/A1 size)
    maxImageSize: 200 * 1024 * 1024, // 200MB
    isEvalSupported: false,
    disableFontFace: false,
    // Enable optimization for large documents
    disableStream: enableProgressiveLoading ? false : true,
    disableAutoFetch: enableProgressiveLoading ? false : true,
    rangeChunkSize: enableProgressiveLoading ? 1024 * 1024 : undefined,
  });
};
