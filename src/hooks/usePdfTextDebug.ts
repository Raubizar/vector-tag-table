
import { useState, useEffect, useRef } from 'react';
import { PDFDocument, Tag, TextExtractionDebugSettings } from '@/lib/types';
import { visualizeTextElements } from '@/lib/pdf/textExtraction';

export interface TextDebugState {
  isDebugActive: boolean;
  debugSettings: TextExtractionDebugSettings;
}

export interface TextDebugActions {
  toggleDebug: () => void;
  updateDebugSettings: (settings: Partial<TextExtractionDebugSettings>) => void;
  visualizeTextForCurrentPage: (canvasRef: React.RefObject<HTMLCanvasElement>) => void;
}

export default function usePdfTextDebug(
  document: PDFDocument | null,
  currentPage: number,
  tags: Tag[],
  selectedTagId: string | null
): [TextDebugState, TextDebugActions] {
  const [isDebugActive, setIsDebugActive] = useState<boolean>(false);
  const [debugSettings, setDebugSettings] = useState<TextExtractionDebugSettings>({
    showTextElements: true,
    highlightTagRegions: true,
    showMetadata: false
  });
  
  const debugCanvasRef = useRef<HTMLCanvasElement | null>(null);
  
  const toggleDebug = () => {
    setIsDebugActive(prev => !prev);
  };
  
  const updateDebugSettings = (settings: Partial<TextExtractionDebugSettings>) => {
    setDebugSettings(prev => ({ ...prev, ...settings }));
  };
  
  const visualizeTextForCurrentPage = async (canvasRef: React.RefObject<HTMLCanvasElement>) => {
    if (!isDebugActive || !document?.data || !canvasRef.current) return;
    
    try {
      await visualizeTextElements(
        canvasRef.current,
        document.data,
        currentPage,
        selectedTagId,
        tags
      );
    } catch (error) {
      console.error('Error visualizing text elements:', error);
    }
  };
  
  return [
    { isDebugActive, debugSettings },
    { toggleDebug, updateDebugSettings, visualizeTextForCurrentPage }
  ];
}
