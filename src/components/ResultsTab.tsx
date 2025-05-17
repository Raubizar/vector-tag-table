
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import ResultsTable from '@/components/ResultsTable';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Bug } from 'lucide-react';
import { ExtractionResult } from '@/lib/types';
import ExtractorDebugPanel from '@/components/debug/ExtractorDebugPanel';
import extractionLogger from '@/lib/pdf/extractionLogger';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface ResultsTabProps {
  results: ExtractionResult[];
  onBackToTags: () => void;
  onRefreshExtraction: () => Promise<void>;
  isProcessing: boolean;
}

const ResultsTab: React.FC<ResultsTabProps> = ({
  results,
  onBackToTags,
  onRefreshExtraction,
  isProcessing
}) => {
  const [debugMode, setDebugMode] = useState<boolean>(false);
  
  // Check if we have any error results
  const hasErrors = results.some(result => 
    result.errorCode || 
    result.extractedText.includes('[Error') || 
    result.extractedText.includes('[No text')
  );
  
  // Toggle debug mode and extraction logging
  const handleToggleDebugMode = (checked: boolean) => {
    setDebugMode(checked);
    if (checked) {
      extractionLogger.enable();
    } else {
      extractionLogger.disable();
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Extraction Results</CardTitle>
            <CardDescription>
              View extracted text from the first page of each document
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Switch 
              id="debug-mode" 
              checked={debugMode}
              onCheckedChange={handleToggleDebugMode}
            />
            <Label htmlFor="debug-mode" className="flex items-center cursor-pointer">
              <Bug className="h-4 w-4 mr-1" />
              Debug Mode
            </Label>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {hasErrors && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Extraction Issues Detected</AlertTitle>
            <AlertDescription>
              Some tags couldn't be properly extracted. This may happen with scanned documents, 
              incorrectly positioned tags, or documents with no text content. Try adjusting 
              tag positions or using a different document.
            </AlertDescription>
          </Alert>
        )}
        
        <ResultsTable results={results} />
        
        <ExtractorDebugPanel
          isVisible={debugMode}
          document={null}
          tags={[]}
          results={results}
          extractionMetadata={extractionLogger.getMetadata()}
        />
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={onBackToTags}
        >
          Back to Tags
        </Button>
        
        <Button
          onClick={onRefreshExtraction}
          disabled={isProcessing}
        >
          {isProcessing ? 'Processing...' : 'Refresh Extraction'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ResultsTab;
