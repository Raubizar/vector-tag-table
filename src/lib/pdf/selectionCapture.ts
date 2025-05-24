
import * as pdfjs from 'pdfjs-dist';
import { getTextSelectionRect } from './textSelection';

/**
 * Captures text selection and prompts for a label
 * @param textLayerDiv Text layer div element 
 * @param viewport PDF.js viewport object
 */
export const setupTextSelectionCapture = (
  textLayerDiv: HTMLDivElement,
  viewport: pdfjs.PageViewport
): void => {
  // Add mouseup event listener to capture selections
  textLayerDiv.addEventListener('mouseup', () => {
    // Get selection info
    const selectionInfo = getTextSelectionRect(textLayerDiv, viewport);
    if (!selectionInfo) return;
    
    // Clear the selection to remove highlighting
    const selection = window.getSelection();
    if (selection) selection.removeAllRanges();
    
    // Extract the normalized coordinates
    const { normalizedCoords } = selectionInfo;
    
    // Only process meaningful selections (not tiny accidental clicks)
    const width = Math.abs(normalizedCoords.x2 - normalizedCoords.x1);
    const height = Math.abs(normalizedCoords.y2 - normalizedCoords.y1);
    
    if (width < 0.001 || height < 0.001) return;
    
    // Prompt for label (can be replaced with a more sophisticated UI)
    const label = prompt('Enter header name for this value (e.g. DRAWING NUMBER)');
    if (!label) return;
    
    // Dispatch event with the captured data
    window.dispatchEvent(new CustomEvent('boxCaptured', {
      detail: { 
        label, 
        boxNorm: normalizedCoords
      }
    }));
  });
};
