
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import ResultsTable from '@/components/ResultsTable';
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
  return (
    <Card>
      <CardHeader>
        <CardTitle>Extraction Results</CardTitle>
        <CardDescription>
          View extracted text from the first page of each document
        </CardDescription>
      </CardHeader>
      <CardContent>
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
