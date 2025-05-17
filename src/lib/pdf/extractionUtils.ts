
import { TextElement } from '../types';

/**
 * Format text elements into a readable string with proper formatting
 * @param elements Array of text elements to format
 * @returns Formatted text string
 */
export const formatTextElements = (elements: TextElement[]): string => {
  if (elements.length === 0) {
    return '';
  }
  
  // Sort elements by position for proper reading order
  const sortedElements = [...elements].sort((a, b) => {
    // Group by approximate lines (using font height)
    const lineHeight = Math.max(a.height, b.height);
    const yThreshold = lineHeight * 0.5;
    
    if (Math.abs(a.position.y - b.position.y) <= yThreshold) {
      // Same line, sort by X
      return a.position.x - b.position.x;
    }
    // Different lines, sort by Y
    return a.position.y - b.position.y;
  });
  
  // Combine text with proper formatting
  let formattedText = '';
  let lastY: number | null = null;
  let lastElement: TextElement | null = null;
  
  for (const element of sortedElements) {
    if (lastY !== null && lastElement !== null) {
      const yDiff = Math.abs(element.position.y - lastY);
      const isNewLine = yDiff > element.height * 1.2;
      const isNewParagraph = yDiff > element.height * 2.5;
      
      if (isNewParagraph) {
        formattedText += '\n\n';
      } else if (isNewLine) {
        formattedText += '\n';
      } else {
        // Check if we need a space between elements on the same line
        const xDiff = element.position.x - (lastElement.position.x + lastElement.width);
        if (xDiff > element.width * 0.3) {
          formattedText += ' ';
        }
      }
    }
    
    formattedText += element.text;
    lastY = element.position.y;
    lastElement = element;
  }
  
  // Clean up the text
  return formattedText
    .replace(/\s+/g, ' ')         // Replace multiple spaces with a single space
    .replace(/(\n\s*){3,}/g, '\n\n') // Replace multiple consecutive line breaks with just two
    .trim();
};

/**
 * Filter text elements that are within a specified region
 * @param elements Array of text elements
 * @param region Region coordinates {x, y, width, height}
 * @returns Filtered array of text elements
 */
export const filterElementsByRegion = (
  elements: TextElement[], 
  region: {x: number, y: number, width: number, height: number}
): TextElement[] => {
  return elements.filter(element => 
    element.position.x >= region.x &&
    element.position.x <= (region.x + region.width) &&
    element.position.y >= region.y &&
    element.position.y <= (region.y + region.height)
  );
};
