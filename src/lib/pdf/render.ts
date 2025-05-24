import * as pdfjs from 'pdfjs-dist';
import { createPdfLoadingTask } from './core';
import { cloneArrayBuffer } from './safeBufferUtils';
import { createTextLayer } from './textLayer';
import { setupTextSelectionCapture } from './selectionCapture';

// Enhanced rendering options for PDF pages
export interface RenderOptions {
  enableOptimizedRendering?: boolean;
  enableProgressiveLoading?: boolean;
  useHighQualityRendering?: boolean;
  enableTextLayer?: boolean; // Option for text layer
  enableTextCapture?: boolean; // Option for text capture functionality
  pageHash?: string; // Optional page hash for template identification
}

export const renderPdfPage = async (
  container: HTMLDivElement,
  data: ArrayBuffer,
  pageNumber = 1,
  scale = 1.0,
  options: RenderOptions = {}
): Promise<{ 
  width: number; 
  height: number;
  page?: pdfjs.PDFPageProxy;
  viewport?: pdfjs.PageViewport;
  textLayer?: HTMLDivElement;
}> => {
  // Clear container
  container.innerHTML = '';
  
  try {
    // Create a safe copy of the data before passing to PDF.js
    // PDF.js will detach this buffer, so we need to clone it
    const safeData = cloneArrayBuffer(data);
    
    // Create PDF loading task with optimized settings
    const loadingTask = createPdfLoadingTask(safeData, options.enableProgressiveLoading);
    
    // Set empty password handler to avoid prompts
    loadingTask.onPassword = () => {}; 
    
    const pdf = await loadingTask.promise;
    
    // Get page
    const page = await pdf.getPage(pageNumber);
    
    // Calculate viewport
    const viewport = page.getViewport({ scale });
    
    // Create canvas using the browser's document object
    const canvas = window.document.createElement('canvas');
    const context = canvas.getContext('2d', { 
      alpha: false,
      // Use higher quality rendering when needed
      desynchronized: !options.useHighQualityRendering,
    });
    
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
      
      // Create wrapper div for positioning both canvas and text layer
      const wrapper = document.createElement('div');
      wrapper.style.position = 'relative';
      wrapper.style.width = '100%';
      wrapper.style.height = 'auto';
      wrapper.appendChild(canvas);
      container.appendChild(wrapper);
      
      // Render PDF page to canvas with optimized rendering
      const renderContext = {
        canvasContext: context,
        viewport: adjustedViewport,
        // Enhanced rendering options
        enableWebGL: true,
        renderInteractiveForms: false
      };
      
      // Show rendering progress for large PDFs
      if (options.enableProgressiveLoading) {
        // For progressive rendering of large documents
        const renderTask = page.render(renderContext);
        await renderTask.promise;
      } else {
        await page.render(renderContext).promise;
      }
      
      // Create text layer if enabled
      let textLayer;
      if (options.enableTextLayer) {
        textLayer = await createTextLayer(wrapper, page, adjustedViewport);
        
        // Setup text selection capture if enabled
        if (options.enableTextCapture && textLayer) {
          setupTextSelectionCapture(textLayer, adjustedViewport, options.pageHash);
        }
      }
      
      return {
        width: viewport.width, // Return original dimensions for proper scaling
        height: viewport.height,
        page,
        viewport,
        textLayer
      };
    } else {
      // Standard rendering for normal sized PDFs
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      canvas.style.width = '100%';
      canvas.style.height = 'auto';
      
      // Create wrapper div for positioning both canvas and text layer
      const wrapper = document.createElement('div');
      wrapper.style.position = 'relative';
      wrapper.style.width = '100%';
      wrapper.style.height = 'auto';
      wrapper.appendChild(canvas);
      container.appendChild(wrapper);
      
      // Render PDF page to canvas
      const renderContext = {
        canvasContext: context,
        viewport,
        enableWebGL: true
      };
      
      await page.render(renderContext).promise;
      
      // Create text layer if enabled
      let textLayer;
      if (options.enableTextLayer) {
        textLayer = await createTextLayer(wrapper, page, viewport);
        
        // Setup text selection capture if enabled
        if (options.enableTextCapture && textLayer) {
          setupTextSelectionCapture(textLayer, viewport);
        }
      }
      
      return {
        width: viewport.width,
        height: viewport.height,
        page,
        viewport,
        textLayer
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
