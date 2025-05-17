
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import ResultsTable from '@/components/ResultsTable';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { ExtractionResult } from '@/lib/types';

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
  // Check if we have any error results
  const hasErrors = results.some(result => 
    result.errorCode || 
    result.extractedText.includes('[Error') || 
    result.extractedText.includes('[No text')
  );
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Extraction Results</CardTitle>
        <CardDescription>
          View extracted text from the first page of each document
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hasErrors && (
          <Alert variant="warning" className="mb-4">
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
