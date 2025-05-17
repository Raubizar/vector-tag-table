
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
}
