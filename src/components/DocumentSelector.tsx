
import React from 'react';
import { Button } from '@/components/ui/button';
import { PDFDocument } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileIcon } from 'lucide-react';

interface DocumentSelectorProps {
  documents: PDFDocument[];
  currentDocument: PDFDocument | null;
  onSelectDocument: (document: PDFDocument) => void;
}

const DocumentSelector: React.FC<DocumentSelectorProps> = ({
  documents,
  currentDocument,
  onSelectDocument
}) => {
  return (
    <div className="mb-4 bg-muted/20 p-2 rounded-lg">
      <div className="flex items-center mb-2">
        <FileIcon className="mr-2 h-4 w-4" />
        <h3 className="text-sm font-medium">Documents</h3>
      </div>
      
      <ScrollArea className="w-full" orientation="horizontal">
        <div className="flex space-x-2 pb-1">
          {documents.length > 0 ? (
            documents.map((doc) => (
              <Button
                key={doc.id}
                variant={currentDocument?.id === doc.id ? "default" : "outline"}
                size="sm"
                className="whitespace-nowrap"
                onClick={() => onSelectDocument(doc)}
              >
                <span className="truncate max-w-[150px] block">{doc.name}</span>
              </Button>
            ))
          ) : (
            <div className="text-sm text-muted-foreground px-2">
              No documents uploaded
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default DocumentSelector;
