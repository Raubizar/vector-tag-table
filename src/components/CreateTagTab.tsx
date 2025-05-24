
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import PDFViewer from '@/components/PDFViewer';
import TagManager from '@/components/TagManager';
import DocumentSelector from '@/components/DocumentSelector';
import ActionsPanel from '@/components/ActionsPanel';
import { PDFDocument, Tag } from '@/lib/types';
import extractionLogger from '@/lib/pdf/extractionLogger';
import { toast } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { ChevronsUpDown } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface CreateTagTabProps {
  documents: PDFDocument[];
  currentDocument: PDFDocument | null;
  tags: Tag[];
  currentTag: Partial<Tag> | null;
  isProcessing: boolean;
  results: any[];
  onRegionSelected: (region: Tag['region']) => void;
  onSaveTag: (tagData: Omit<Tag, 'id'>) => void;
  onDeleteTag: (id: string) => void;
  onSelectTag: (tag: Tag) => void;
  onSelectDocument: (document: PDFDocument) => void;
  onExtractText: () => Promise<void>;
  onViewResults: () => void;
  onClearAll: () => void;
  onTagUpdated: (tagId: string, newRegion: Tag['region']) => void;
}

const CreateTagTab: React.FC<CreateTagTabProps> = ({
  documents,
  currentDocument,
  tags,
  currentTag,
  isProcessing,
  results,
  onRegionSelected,
  onSaveTag,
  onDeleteTag,
  onSelectTag,
  onSelectDocument,
  onExtractText,
  onViewResults,
  onClearAll,
  onTagUpdated
}) => {
  const [showTagPanel, setShowTagPanel] = useState(true);

  const handleExtractText = async () => {
    if (documents.length === 0 || tags.length === 0) {
      toast.error('You need at least one document and one tag to extract text');
      return;
    }

    try {
      // Enable logging for this extraction
      extractionLogger.enable();
      extractionLogger.reset();
      
      // Call the parent component's extract function
      await onExtractText();
      
      toast.success(`Extraction completed successfully`);
      onViewResults();
      
    } catch (error) {
      console.error('Error extracting text:', error);
      toast.error('Failed to extract text from documents');
      
      // Log the error
      extractionLogger.logStep('Extraction failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  };

  const toggleTagPanel = () => {
    setShowTagPanel(!showTagPanel);
  };

  return (
    <div className="space-y-4">
      {/* Document Selector - Horizontal at the top */}
      <DocumentSelector 
        documents={documents}
        currentDocument={currentDocument}
        onSelectDocument={onSelectDocument}
      />
      
      {/* Main Content */}
      <div className="flex flex-col space-y-4">
        {/* PDF Viewer - Expanded to full width */}
        {currentDocument ? (
          <PDFViewer
            document={currentDocument}
            currentPage={1} // Always show page 1
            onRegionSelected={onRegionSelected}
            existingTags={tags}
            onTagUpdated={onTagUpdated}
            autoZoomToBottomRight={true}
          />
        ) : (
          <Card className="w-full">
            <CardContent className="text-center py-12 text-gray-500">
              No document selected
            </CardContent>
          </Card>
        )}

        {/* Tag Management - Now in a sheet that can be opened when needed */}
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Tags ({tags.length})</h3>
          <div className="flex space-x-2">
            {/* Actions buttons from ActionsPanel */}
            <Button 
              onClick={handleExtractText} 
              disabled={documents.length === 0 || tags.length === 0 || isProcessing}
              variant="default"
            >
              Extract Text
            </Button>
            
            <Button 
              onClick={onViewResults} 
              disabled={results.length === 0}
              variant="outline"
            >
              View Results
            </Button>
            
            <Button 
              onClick={onClearAll} 
              variant="destructive"
              size="sm"
            >
              Clear All
            </Button>
          </div>
        </div>
        
        {/* Tag Management Section - Now collapsible */}
        <Card>
          <CardContent className="p-4">
            <TagManager
              tags={tags}
              currentTag={currentTag}
              onSaveTag={onSaveTag}
              onDeleteTag={onDeleteTag}
              onSelectTag={onSelectTag}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateTagTab;
