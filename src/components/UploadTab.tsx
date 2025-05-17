
import React from 'react';
import { Button } from '@/components/ui/button';
import PDFUploader from '@/components/PDFUploader';
import { PDFDocument } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface UploadTabProps {
  onFilesAccepted: (documents: PDFDocument[]) => Promise<void>;
  documentsLength: number;
  onNextTab: () => void;
}

const UploadTab: React.FC<UploadTabProps> = ({ 
  onFilesAccepted, 
  documentsLength, 
  onNextTab 
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload PDF Documents</CardTitle>
        <CardDescription>
          Upload multiple PDF documents to extract information from
        </CardDescription>
      </CardHeader>
      <CardContent>
        <PDFUploader onFilesAccepted={onFilesAccepted} />
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button 
          onClick={onNextTab}
          disabled={documentsLength === 0}
        >
          Next: Create Tags
        </Button>
      </CardFooter>
    </Card>
  );
};

export default UploadTab;
