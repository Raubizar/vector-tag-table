
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ActionsPanelProps {
  onExtractText: () => Promise<void>;
  onViewResults: () => void;
  onClearAll: () => void;
  isProcessing: boolean;
  documentsLength: number;
  tagsLength: number;
  resultsLength: number;
}

const ActionsPanel: React.FC<ActionsPanelProps> = ({
  onExtractText,
  onViewResults,
  onClearAll,
  isProcessing,
  documentsLength,
  tagsLength,
  resultsLength
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Button 
            onClick={onExtractText} 
            disabled={isProcessing || documentsLength === 0 || tagsLength === 0}
            className="w-full"
          >
            {isProcessing ? 'Processing...' : 'Extract Text from First Page of All Documents'}
          </Button>
          
          <Button
            variant="secondary"
            onClick={onViewResults}
            disabled={resultsLength === 0}
            className="w-full"
          >
            View Results
          </Button>
          
          <Button 
            variant="destructive" 
            onClick={onClearAll}
            className="w-full"
          >
            Clear All Data
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ActionsPanel;
