
import { PDFDocument, Tag, ExtractionResult } from './types';

const STORAGE_KEYS = {
  DOCUMENTS: 'pdf-extractor-documents',
  TAGS: 'pdf-extractor-tags',
  RESULTS: 'pdf-extractor-results',
};

export const saveDocuments = (documents: PDFDocument[]): void => {
  // Save document metadata without actual file data
  const documentsToSave = documents.map(({ id, name }) => ({ id, name }));
  localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(documentsToSave));
};

export const saveTags = (tags: Tag[]): void => {
  localStorage.setItem(STORAGE_KEYS.TAGS, JSON.stringify(tags));
};

export const saveResults = (results: ExtractionResult[]): void => {
  localStorage.setItem(STORAGE_KEYS.RESULTS, JSON.stringify(results));
};

export const getDocuments = (): Partial<PDFDocument>[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.DOCUMENTS);
  return stored ? JSON.parse(stored) : [];
};

export const getTags = (): Tag[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.TAGS);
  return stored ? JSON.parse(stored) : [];
};

export const getResults = (): ExtractionResult[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.RESULTS);
  return stored ? JSON.parse(stored) : [];
};

export const clearAllData = (): void => {
  localStorage.removeItem(STORAGE_KEYS.DOCUMENTS);
  localStorage.removeItem(STORAGE_KEYS.TAGS);
  localStorage.removeItem(STORAGE_KEYS.RESULTS);
};
