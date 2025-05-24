// This utility fixes PDF rendering and interaction issues
import { toast } from 'sonner';

/**
 * Fix PDF viewer interaction issues
 * @param containerElement The PDF container element
 */
export function fixPdfViewerInteractions(containerElement: HTMLElement | null) {
  if (!containerElement) return;
  
  // Make sure we don't have event duplication
  containerElement.removeEventListener('mousedown', preventBrowserSelectionOnPdf);
  containerElement.addEventListener('mousedown', preventBrowserSelectionOnPdf);
  
  // Fix for mobile devices
  containerElement.removeEventListener('touchstart', preventBrowserDefaultTouchBehavior);
  containerElement.addEventListener('touchstart', preventBrowserDefaultTouchBehavior);
  
  // Fix for wheel zoom prevention
  containerElement.removeEventListener('wheel', handleWheelEvent);
  containerElement.addEventListener('wheel', handleWheelEvent);
  
  console.log('PDF viewer interactions fixed');
  
  // Add CSS fixes if needed
  addCssFixes();
}

/**
 * Prevent browser's default text selection during PDF interaction
 */
function preventBrowserSelectionOnPdf(event: MouseEvent) {
  // Check if this is our own custom interaction vs. text selection
  const target = event.target as HTMLElement;
  const isTextLayer = target.classList.contains('pdf-text-layer') || 
                      target.closest('.pdf-text-layer');
  
  if (!isTextLayer) {
    // Prevent browser's text selection
    event.preventDefault();
  }
}

/**
 * Handle touch events for mobile support
 */
function preventBrowserDefaultTouchBehavior(event: TouchEvent) {
  // Allow multi-touch for pinch-zoom, but prevent browser handling
  if (event.touches.length > 1) {
    event.preventDefault();
  }
}

/**
 * Handle wheel events for zoom
 */
function handleWheelEvent(event: WheelEvent) {
  // Only prevent default if Ctrl key is pressed (browser zoom)
  if (event.ctrlKey) {
    event.preventDefault();
    // We could implement custom zoom here if needed
  }
}

/**
 * Add CSS fixes for PDF rendering
 */
function addCssFixes() {
  // Check if our style is already added
  if (document.getElementById('pdf-viewer-fixes-css')) return;
  
  const style = document.createElement('style');
  style.id = 'pdf-viewer-fixes-css';
  style.textContent = `
    /* Fix for pointer events */
    .pdf-canvas-container {
      touch-action: none; /* Disable browser handling of touch */
    }
    
    /* Fix for text selection */
    .pdf-text-layer {
      pointer-events: auto !important;
      opacity: 0.2 !important;
    }
    
    /* Fix for tag overlay interactions */
    .tag-overlay {
      pointer-events: all !important;
    }
  `;
  
  document.head.appendChild(style);
}

export default fixPdfViewerInteractions;
