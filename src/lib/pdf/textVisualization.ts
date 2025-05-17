
import { Tag, TextElement } from '../types';
import { cloneArrayBuffer } from './safeBufferUtils';
import { extractTextElementsFromPage } from './textElement';

/**
 * Visualize text elements on a canvas for debugging
 * @param canvas HTML Canvas element to draw on
 * @param data PDF ArrayBuffer data
 * @param pageNumber Page number to visualize
 * @param selectedTagId Optional ID of the currently selected tag
 * @param tags Optional array of tags for highlighting
 */
export const visualizeTextElements = async (
  canvas: HTMLCanvasElement,
  data: ArrayBuffer,
  pageNumber: number,
  selectedTagId?: string,
  tags?: Tag[]
): Promise<void> => {
  try {
    const safeData = cloneArrayBuffer(data);
    const textElements = await extractTextElementsFromPage(safeData, pageNumber);
    
    if (!canvas || textElements.length === 0) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw text element boxes
    textElements.forEach((element) => {
      ctx.strokeStyle = 'rgba(0, 128, 255, 0.5)';
      ctx.lineWidth = 1;
      
      // Check if this text element is within any tag's region
      let isInSelectedTag = false;
      
      if (tags && selectedTagId) {
        const selectedTag = tags.find(tag => tag.id === selectedTagId);
        if (selectedTag) {
          const { x, y, width, height } = selectedTag.region;
          isInSelectedTag = (
            element.position.x >= x &&
            element.position.x <= (x + width) &&
            element.position.y >= y &&
            element.position.y <= (y + height)
          );
        }
      }
      
      // Highlight text elements in the selected tag
      if (isInSelectedTag) {
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.8)';
        ctx.lineWidth = 2;
      }
      
      ctx.strokeRect(
        element.position.x,
        element.position.y,
        element.width,
        element.height
      );
      
      // Add text label (optional)
      if (isInSelectedTag) {
        ctx.font = '10px Arial';
        ctx.fillStyle = 'rgba(255, 215, 0, 0.8)';
        ctx.fillText(
          element.text,
          element.position.x,
          element.position.y - 2
        );
      }
    });
  } catch (error) {
    console.error('Error visualizing text elements:', error);
  }
};
