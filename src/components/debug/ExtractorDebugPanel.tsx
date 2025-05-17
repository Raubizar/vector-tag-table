
import React, { useState } from 'react';
import { ExtractionResult, Tag, PDFDocument, TextElement } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Layers, FileText, Code, Bug } from 'lucide-react';

interface ExtractorDebugPanelProps {
  isVisible: boolean;
  document: PDFDocument | null;
  tags: Tag[];
  results: ExtractionResult[];
  extractionMetadata?: {
    startTime?: number;
    endTime?: number;
    extractedElements?: Record<string, TextElement[]>;
    processingSteps?: Array<{
      step: string;
      timestamp: number;
      details: any;
    }>;
  };
}

const ExtractorDebugPanel: React.FC<ExtractorDebugPanelProps> = ({
  isVisible,
  document,
  tags,
  results,
  extractionMetadata = {}
}) => {
  const [activeTab, setActiveTab] = useState<string>("document");
  
  if (!isVisible) return null;
  
  const { startTime, endTime, extractedElements, processingSteps } = extractionMetadata;
  const processingTimeMs = startTime && endTime ? endTime - startTime : null;
  
  const getTagRegionText = (tag: Tag) => {
    const result = results.find(r => r.tagId === tag.id);
    return result?.extractedText || 'No text extracted';
  };
  
  const getStatusBadge = (errorCode?: string) => {
    if (!errorCode) {
      return <Badge className="bg-green-500">Success</Badge>;
    }
    
    switch (errorCode) {
      case 'NO_TEXT_CONTENT':
        return <Badge variant="destructive">No Text In Document</Badge>;
      case 'EMPTY_REGION':
        return <Badge variant="destructive">Empty Region</Badge>;
      case 'PROCESSING_ERROR':
        return <Badge variant="destructive">Processing Error</Badge>;
      default:
        return <Badge variant="destructive">{errorCode}</Badge>;
    }
  };
  
  return (
    <Card className="w-full mt-6 overflow-hidden border-amber-500">
      <CardHeader className="bg-amber-50">
        <div className="flex justify-between items-center">
          <CardTitle className="text-amber-800 flex items-center">
            <Bug className="mr-2 h-5 w-5" />
            Text Extraction Debugger
          </CardTitle>
          {processingTimeMs && (
            <Badge variant="outline" className="text-amber-700 border-amber-500">
              Processing time: {processingTimeMs}ms
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full border-b border-gray-200 bg-gray-100">
            <TabsTrigger value="document" className="flex items-center">
              <FileText className="mr-1 h-4 w-4" />
              Document
            </TabsTrigger>
            <TabsTrigger value="tags" className="flex items-center">
              <Layers className="mr-1 h-4 w-4" />
              Tags
            </TabsTrigger>
            <TabsTrigger value="steps" className="flex items-center">
              <Code className="mr-1 h-4 w-4" />
              Processing Steps
            </TabsTrigger>
          </TabsList>
          
          <ScrollArea className="h-80">
            <TabsContent value="document" className="p-4">
              <h3 className="text-lg font-medium mb-2">Document Information</h3>
              {document ? (
                <div className="space-y-2">
                  <div>
                    <strong>Name:</strong> {document.name}
                  </div>
                  <div>
                    <strong>Size:</strong> {document.data ? `${Math.round(document.data.byteLength / 1024)} KB` : 'Unknown'}
                  </div>
                  <div>
                    <strong>Is Scanned:</strong> {document.isScanned ? 'Yes (Text extraction may be limited)' : 'No'}
                  </div>
                </div>
              ) : (
                <div className="text-gray-500">No document selected</div>
              )}
            </TabsContent>
            
            <TabsContent value="tags" className="p-0">
              <div className="p-4">
                <h3 className="text-lg font-medium mb-2">Tags & Extraction Results</h3>
              </div>
              
              <Accordion type="single" collapsible className="w-full">
                {tags.map(tag => {
                  const result = results.find(r => r.tagId === tag.id);
                  const extractedElements = result?.textElements || [];
                  
                  return (
                    <AccordionItem key={tag.id} value={tag.id}>
                      <AccordionTrigger className="px-4 hover:bg-gray-50">
                        <div className="flex items-center justify-between w-full pr-4">
                          <div className="flex items-center">
                            <div 
                              className="w-3 h-3 rounded-full mr-2"
                              style={{ backgroundColor: tag.color }}
                            ></div>
                            <span>{tag.name}</span>
                          </div>
                          {result && getStatusBadge(result.errorCode)}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pt-2 pb-4">
                        <div className="space-y-3">
                          <div>
                            <div className="text-sm font-medium mb-1">Region</div>
                            <div className="text-xs bg-gray-100 p-2 rounded">
                              x: {tag.region.x.toFixed(2)}, y: {tag.region.y.toFixed(2)},
                              width: {tag.region.width.toFixed(2)}, height: {tag.region.height.toFixed(2)}
                            </div>
                          </div>
                          
                          <div>
                            <div className="text-sm font-medium mb-1">Extracted Text</div>
                            <div className="text-xs bg-gray-100 p-2 rounded max-h-40 overflow-y-auto whitespace-pre-wrap">
                              {getTagRegionText(tag) || 'No text extracted'}
                            </div>
                          </div>
                          
                          {extractedElements.length > 0 && (
                            <div>
                              <div className="text-sm font-medium mb-1">
                                Text Elements ({extractedElements.length})
                              </div>
                              <div className="text-xs bg-gray-100 p-2 rounded max-h-60 overflow-y-auto">
                                {extractedElements.map((el, i) => (
                                  <div key={i} className="mb-1 pb-1 border-b border-gray-200">
                                    <div>Text: "{el.text}"</div>
                                    <div>Position: ({el.position.x.toFixed(2)}, {el.position.y.toFixed(2)})</div>
                                    <div>Size: {el.width.toFixed(2)} × {el.height.toFixed(2)}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {result?.errorCode && (
                            <div>
                              <div className="text-sm font-medium mb-1 text-red-600">Error</div>
                              <div className="text-xs bg-red-50 text-red-800 p-2 rounded">
                                {result.errorCode}: {result.extractedText}
                              </div>
                            </div>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </TabsContent>
            
            <TabsContent value="steps" className="p-4">
              <h3 className="text-lg font-medium mb-2">Extraction Process Steps</h3>
              {processingSteps && processingSteps.length > 0 ? (
                <div className="space-y-4">
                  {processingSteps.map((step, index) => (
                    <div key={index} className="border-l-2 border-amber-400 pl-3 py-1">
                      <div className="text-sm font-medium">{step.step}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(step.timestamp).toISOString().substr(11, 12)}
                      </div>
                      <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                        {typeof step.details === 'object' 
                          ? JSON.stringify(step.details, null, 2)
                          : String(step.details)
                        }
                      </pre>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500">No processing data available</div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </CardContent>
      <CardFooter className="bg-amber-50 border-t border-amber-200">
        <div className="w-full text-xs text-amber-800">
          This debugging panel shows detailed extraction information to help diagnose issues with PDF text extraction.
        </div>
      </CardFooter>
    </Card>
  );
};

export default ExtractorDebugPanel;
