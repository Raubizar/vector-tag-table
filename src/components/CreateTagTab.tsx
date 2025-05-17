
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import PDFViewer from '@/components/PDFViewer';
import TagManager from '@/components/TagManager';
import DocumentSelector from '@/components/DocumentSelector';
import ActionsPanel from '@/components/ActionsPanel';
import { PDFDocument, Tag } from '@/lib/types';

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
  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Document Preview</CardTitle>
            <CardDescription>
              Select a region on page 1 to create a new tag, or use the move/resize tools to adjust existing tags
            </CardDescription>
          </CardHeader>
          <CardContent>
            {currentDocument ? (
              <div className="space-y-4">
                <PDFViewer
                  document={currentDocument}
                  currentPage={1} // Always show page 1
                  onRegionSelected={onRegionSelected}
                  existingTags={tags}
                  onTagUpdated={onTagUpdated}
                />
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                No document selected
              </div>
            )}
          </CardContent>
        </Card>
        
        <DocumentSelector 
          documents={documents}
          currentDocument={currentDocument}
          onSelectDocument={onSelectDocument}
        />
      </div>
      
      <div>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Tag Management</CardTitle>
            <CardDescription>
              Create and manage extraction tags
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TagManager
              tags={tags}
              currentTag={currentTag}
              onSaveTag={onSaveTag}
              onDeleteTag={onDeleteTag}
              onSelectTag={onSelectTag}
            />
          </CardContent>
        </Card>
        
        <ActionsPanel
          onExtractText={onExtractText}
          onViewResults={onViewResults}
          onClearAll={onClearAll}
          isProcessing={isProcessing}
          documentsLength={documents.length}
          tagsLength={tags.length}
          resultsLength={results.length}
        />
      </div>
    </div>
  );
};

export default CreateTagTab;
