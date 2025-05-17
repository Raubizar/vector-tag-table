
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { PDFDocument } from '@/lib/types';
import { Upload, FileText, X } from 'lucide-react';

interface PDFUploaderProps {
  onFilesAccepted: (documents: PDFDocument[]) => void;
}

const PDFUploader: React.FC<PDFUploaderProps> = ({ onFilesAccepted }) => {
  const [uploadedFiles, setUploadedFiles] = useState<PDFDocument[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const pdfFiles = acceptedFiles.filter(
      file => file.type === 'application/pdf'
    );

    if (pdfFiles.length === 0) {
      toast.error('Please upload only PDF files');
      return;
    }

    if (pdfFiles.length !== acceptedFiles.length) {
      toast.warning('Some non-PDF files were ignored');
    }

    const newDocuments = pdfFiles.map(file => ({
      id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      file
    }));

    setUploadedFiles(prev => [...prev, ...newDocuments]);
    onFilesAccepted(newDocuments);
    
    toast.success(`${pdfFiles.length} PDF file${pdfFiles.length > 1 ? 's' : ''} uploaded`);
  }, [onFilesAccepted]);

  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== id));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: true
  });

  return (
    <div className="w-full mb-6">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-lg font-medium">
          {isDragActive ? 'Drop PDFs here...' : 'Drag & drop PDF files here'}
        </p>
        <p className="mt-1 text-sm text-gray-500">or click to browse</p>
        <Button variant="outline" className="mt-4">
          Select Files
        </Button>
      </div>

      {uploadedFiles.length > 0 && (
        <div className="mt-4">
          <h3 className="font-medium mb-2">Uploaded PDFs:</h3>
          <ul className="space-y-2">
            {uploadedFiles.map(doc => (
              <li
                key={doc.id}
                className="flex items-center justify-between bg-gray-50 p-2 rounded"
              >
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-blue-500" />
                  <span className="truncate max-w-xs">{doc.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(doc.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default PDFUploader;
