
import { TextElement } from '@/lib/types';

export interface ExtractionMetadata {
  startTime?: number;
  endTime?: number;
  extractedElements?: Record<string, TextElement[]>;
  processingSteps?: Array<{
    step: string;
    timestamp: number;
    details: any;
  }>;
}

class ExtractionLogger {
  private static instance: ExtractionLogger;
  private metadata: ExtractionMetadata = {
    processingSteps: []
  };
  private isEnabled: boolean = false;

  private constructor() {}

  static getInstance(): ExtractionLogger {
    if (!ExtractionLogger.instance) {
      ExtractionLogger.instance = new ExtractionLogger();
    }
    return ExtractionLogger.instance;
  }

  enable(): void {
    this.isEnabled = true;
    this.reset();
  }

  disable(): void {
    this.isEnabled = false;
  }

  reset(): void {
    this.metadata = {
      processingSteps: []
    };
  }

  isLoggingEnabled(): boolean {
    return this.isEnabled;
  }

  startExtraction(): void {
    if (!this.isEnabled) return;
    
    this.metadata.startTime = performance.now();
    this.logStep('Extraction process started', {
      timestamp: this.metadata.startTime
    });
  }

  finishExtraction(): void {
    if (!this.isEnabled) return;
    
    this.metadata.endTime = performance.now();
    this.logStep('Extraction process finished', {
      timestamp: this.metadata.endTime,
      totalTime: this.metadata.endTime - (this.metadata.startTime || 0)
    });
  }

  logStep(stepName: string, details: any = {}): void {
    if (!this.isEnabled) return;
    
    if (!this.metadata.processingSteps) {
      this.metadata.processingSteps = [];
    }
    
    this.metadata.processingSteps.push({
      step: stepName,
      timestamp: performance.now(),
      details
    });
  }

  storeExtractedElements(tagId: string, elements: TextElement[]): void {
    if (!this.isEnabled) return;
    
    if (!this.metadata.extractedElements) {
      this.metadata.extractedElements = {};
    }
    
    this.metadata.extractedElements[tagId] = elements;
  }

  getMetadata(): ExtractionMetadata {
    return { ...this.metadata };
  }
}

export const extractionLogger = ExtractionLogger.getInstance();

export default extractionLogger;
