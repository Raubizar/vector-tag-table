
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PDFDocument } from '@/lib/types';

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
    <Card>
      <CardHeader>
        <CardTitle>Document Selection</CardTitle>
        <CardDescription>
          Switch between uploaded documents
        </CardDescription>
      </CardHeader>
      <CardContent>
        {documents.length > 0 ? (
          <div className="space-y-2">
            {documents.map((doc) => (
              <Button
                key={doc.id}
                variant={currentDocument?.id === doc.id ? "default" : "outline"}
                className="w-full justify-start text-left overflow-hidden"
                onClick={() => onSelectDocument(doc)}
              >
                <span className="truncate">{doc.name}</span>
              </Button>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">
            No documents uploaded
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DocumentSelector;
