
export interface Tag {
  id: string;
  name: string;
  color: string;
  region: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface PDFDocument {
  id: string;
  name: string;
  file: File;
  data?: ArrayBuffer;
  isScanned?: boolean; // Flag to indicate if the document is likely scanned/image-based
}

export interface TextElement {
  text: string;
  position: {
    x: number;
    y: number;
  };
  width: number;
  height: number;
  fontSize: number;
  fontName: string;
}

export interface ExtractionResult {
  id: string;
  documentId: string;
  fileName: string;
  pageNumber: number;
  tagId: string;
  tagName: string;
  extractedText: string;
  textElements?: TextElement[]; // Optional array of text elements with metadata
  errorCode?: 'NO_TEXT_CONTENT' | 'EMPTY_REGION' | 'PROCESSING_ERROR' | string; // Error code for better debugging
}

// Debug settings for text extraction
export interface TextExtractionDebugSettings {
  showTextElements: boolean;
  highlightTagRegions: boolean;
  showMetadata: boolean;
}
