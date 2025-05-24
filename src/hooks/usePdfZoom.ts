
import { useState, useCallback, RefObject, useRef } from 'react';

export interface ZoomRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface UsePdfZoomProps {
  scrollContainerRef: RefObject<HTMLDivElement>;
  onZoomChange?: (newScale: number) => void;
}

export default function usePdfZoom({ 
  scrollContainerRef, 
  onZoomChange 
}: UsePdfZoomProps) {
  const [scale, setScale] = useState(1);
  const zoomTimeoutRef = useRef<number | null>(null);
  
  const handleZoomIn = useCallback(() => {
    const newScale = Math.min(3, scale + 0.1);
    setScale(newScale);
    onZoomChange?.(newScale);
  }, [scale, onZoomChange]);
  
  const handleZoomOut = useCallback(() => {
    const newScale = Math.max(0.4, scale - 0.1);
    setScale(newScale);
    onZoomChange?.(newScale);
  }, [scale, onZoomChange]);
  
  const handleResetZoom = useCallback(() => {
    setScale(1);
    onZoomChange?.(1);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = 0;
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [scrollContainerRef, onZoomChange]);
  
  const handleScaleChange = useCallback((newScale: number) => {
    setScale(newScale);
    onZoomChange?.(newScale);
  }, [onZoomChange]);
  
  const zoomToRegion = useCallback((region: ZoomRegion) => {
    if (!scrollContainerRef.current) return;
    
    // Clear any existing timeout to prevent conflicts
    if (zoomTimeoutRef.current) {
      window.clearTimeout(zoomTimeoutRef.current);
      zoomTimeoutRef.current = null;
    }
    
    // Calculate new scale to fit the region with padding
    const containerWidth = scrollContainerRef.current.clientWidth;
    const containerHeight = scrollContainerRef.current.clientHeight;
    
    // Calculate the scale needed to fit the selection in the viewport (with padding)
    const padding = 20; // pixels of padding around the selection
    const scaleX = (containerWidth - 2 * padding) / region.width;
    const scaleY = (containerHeight - 2 * padding) / region.height;
    const newScale = Math.min(Math.min(scaleX, scaleY), 3); // Cap at 3x zoom
    
    // Set the new scale
    setScale(newScale);
    onZoomChange?.(newScale);
    
    // After scale update, scroll to center the region
    zoomTimeoutRef.current = window.setTimeout(() => {
      if (!scrollContainerRef.current) return;
      
      // Calculate the scroll position to center on the region
      const targetX = region.x * newScale - (containerWidth - region.width * newScale) / 2;
      const targetY = region.y * newScale - (containerHeight - region.height * newScale) / 2;
      
      // Set scroll position with smooth behavior
      scrollContainerRef.current.scrollTo({
        left: Math.max(0, targetX),
        top: Math.max(0, targetY),
        behavior: 'smooth'
      });
      
      zoomTimeoutRef.current = null;
    }, 100);
  }, [scrollContainerRef, onZoomChange]);
  
  return {
    scale,
    handleZoomIn,
    handleZoomOut,
    handleResetZoom,
    handleScaleChange,
    zoomToRegion
  };
}
