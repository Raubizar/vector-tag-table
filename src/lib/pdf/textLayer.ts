
import * as pdfjs from 'pdfjs-dist';
import type { TextItem } from 'pdfjs-dist/types/src/display/api';

/**
 * Creates a text layer div for text selection in PDFs
 * @param container Container element to append the text layer to
 * @param page PDF.js page object
 * @param viewport PDF.js viewport object
 * @returns HTMLDivElement containing the text layer
 */
export const createTextLayer = async (
  container: HTMLDivElement,
  page: pdfjs.PDFPageProxy,
  viewport: pdfjs.PageViewport
): Promise<HTMLDivElement> => {
  // Create text layer div
  const textLayerDiv = document.createElement('div');
  textLayerDiv.className = 'pdf-text-layer';
  textLayerDiv.style.position = 'absolute';
  textLayerDiv.style.left = '0';
  textLayerDiv.style.top = '0';
  textLayerDiv.style.right = '0';
  textLayerDiv.style.bottom = '0';
  textLayerDiv.style.overflow = 'hidden';
  textLayerDiv.style.opacity = '0.2'; // Make text layer slightly visible for debugging
  textLayerDiv.style.lineHeight = '1.0';
  textLayerDiv.style.userSelect = 'text';
  textLayerDiv.style.cursor = 'text';
  textLayerDiv.style.pointerEvents = 'auto'; // Allow user interaction
  
  container.appendChild(textLayerDiv);

  // Get text content from page
  const textContent = await page.getTextContent();

  // Create text layer builder - we're manually constructing it since
  // PDF.js doesn't export TextLayerBuilder directly
  
  // We need to manually create and position text spans
  const textItems = textContent.items;
  const textDivs: HTMLSpanElement[] = [];
  
  for (let i = 0; i < textItems.length; i++) {
    const item = textItems[i];
    
    // Type guard to check if this item is a TextItem (not TextMarkedContent)
    if (!('str' in item) || !item.str || item.str.trim() === '') {
      continue;
    }
    
    // At this point TypeScript knows item is a TextItem with the str property
    const textItem = item as TextItem;
    
    // Create text span
    const textSpan = document.createElement('span');
    textSpan.textContent = textItem.str;
    
    // Position the span using the text item's transform
    const tx = textItem.transform;
    
    // Apply transform - these values come from the PDF and define
    // the position and scaling of each character
    const fontSize = Math.sqrt((tx[2] * tx[2]) + (tx[3] * tx[3]));
    
    if ('dir' in textItem && textItem.dir) {
      textSpan.dir = textItem.dir;
    }
    
    // Set style with transform
    textSpan.style.transform = `matrix(${tx[0]}, ${tx[1]}, ${tx[2]}, ${tx[3]}, ${tx[4]}, ${tx[5]})`;
    textSpan.style.left = '0px';
    textSpan.style.top = '0px';
    textSpan.style.fontFamily = 'fontName' in textItem ? textItem.fontName || 'sans-serif' : 'sans-serif';
    textSpan.style.fontSize = `${fontSize}px`;
    textSpan.style.position = 'absolute';
    
    // Add to container
    textLayerDiv.appendChild(textSpan);
    textDivs.push(textSpan);
  }
  
  return textLayerDiv;
};
