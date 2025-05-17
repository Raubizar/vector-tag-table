
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import PDFUploader from '@/components/PDFUploader';
import PDFViewer from '@/components/PDFViewer';
import TagManager from '@/components/TagManager';
import ResultsTable from '@/components/ResultsTable';
import { PDFDocument, Tag, ExtractionResult } from '@/lib/types';
import { loadPdfDocument, extractTextFromAllDocuments } from '@/lib/pdfUtils';
import { saveDocuments, saveTags, saveResults, getTags, getResults } from '@/lib/store';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Index = () => {
  const [documents, setDocuments] = useState<PDFDocument[]>([]);
  const [currentDocument, setCurrentDocument] = useState<PDFDocument | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [tags, setTags] = useState<Tag[]>([]);
  const [currentTag, setCurrentTag] = useState<Partial<Tag> | null>(null);
  const [results, setResults] = useState<ExtractionResult[]>([]);
  const [activeTab, setActiveTab] = useState('upload');
  const [isProcessing, setIsProcessing] = useState(false);

  // Load saved tags and results on component mount
  useEffect(() => {
    const savedTags = getTags();
    const savedResults = getResults();
    
    if (savedTags.length > 0) {
      setTags(savedTags);
    }
    
    if (savedResults.length > 0) {
      setResults(savedResults);
    }
  }, []);

  const handleFilesAccepted = async (newDocuments: PDFDocument[]) => {
    try {
      // Load PDF data for each document
      const documentsWithData = await Promise.all(
        newDocuments.map(async (doc) => {
          const data = await loadPdfDocument(doc.file);
          return { ...doc, data };
        })
      );

      setDocuments(prev => [...prev, ...documentsWithData]);
      saveDocuments([...documents, ...documentsWithData]);

      // Set the current document if it's the first one
      if (!currentDocument) {
        setCurrentDocument(documentsWithData[0]);
      }
      
      // Auto-switch to create tag tab if we have documents
      if (activeTab === 'upload') {
        setActiveTab('create-tag');
      }
    } catch (error) {
      console.error('Error loading PDF data:', error);
      toast.error('Failed to load PDF data');
    }
  };

  const handleRegionSelected = (region: Tag['region']) => {
    setCurrentTag({ region });
    toast.info('Region selected. Enter a name for your tag.');
  };

  const handleSaveTag = (tagData: Omit<Tag, 'id'>) => {
    const newTag: Tag = {
      ...tagData,
      id: `tag-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    setTags(prev => [...prev, newTag]);
    saveTags([...tags, newTag]);
    setCurrentTag(null);
    
    toast.success(`Tag "${newTag.name}" created`);
  };

  const handleDeleteTag = (id: string) => {
    setTags(prev => prev.filter(tag => tag.id !== id));
    saveTags(tags.filter(tag => tag.id !== id));
    
    // Also remove related results
    const filteredResults = results.filter(result => result.tagId !== id);
    setResults(filteredResults);
    saveResults(filteredResults);
    
    toast.info('Tag deleted');
  };

  const handleSelectTag = (tag: Tag) => {
    // This could be used to edit tags in the future
    toast.info(`Selected tag: ${tag.name}`);
  };

  const handleExtractText = async () => {
    if (documents.length === 0 || tags.length === 0) {
      toast.error('You need at least one document and one tag to extract text');
      return;
    }

    setIsProcessing(true);

    try {
      const extractionResults = await extractTextFromAllDocuments(documents, tags);
      setResults(extractionResults);
      saveResults(extractionResults);
      
      toast.success(`Extracted ${extractionResults.length} results`);
      setActiveTab('results');
    } catch (error) {
      console.error('Error extracting text:', error);
      toast.error('Failed to extract text from documents');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleChangePage = (delta: number) => {
    setCurrentPage(prev => Math.max(1, prev + delta));
  };

  const handleClearAll = () => {
    setDocuments([]);
    setCurrentDocument(null);
    setCurrentPage(1);
    setTags([]);
    setCurrentTag(null);
    setResults([]);
    
    // Clear local storage
    localStorage.clear();
    
    toast.info('All data cleared');
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">PDF Tagging & Extraction</h1>
        <p className="text-gray-600">
          Upload PDF documents, create tags for specific regions, and extract text data
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload">1. Upload PDFs</TabsTrigger>
          <TabsTrigger value="create-tag" disabled={documents.length === 0}>
            2. Create Tags
          </TabsTrigger>
          <TabsTrigger value="results" disabled={results.length === 0}>
            3. Results
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload PDF Documents</CardTitle>
              <CardDescription>
                Bulk upload multiple vector PDFs from Revit, AutoCAD, or similar software
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PDFUploader onFilesAccepted={handleFilesAccepted} />
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button 
                onClick={() => setActiveTab('create-tag')}
                disabled={documents.length === 0}
              >
                Next: Create Tags
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="create-tag" className="mt-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <div>
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Document Preview</CardTitle>
                  <CardDescription>
                    Select a region to create a new tag
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {currentDocument ? (
                    <div className="space-y-4">
                      <PDFViewer
                        document={currentDocument}
                        currentPage={currentPage}
                        onRegionSelected={handleRegionSelected}
                        existingTags={tags}
                      />
                      
                      <div className="flex justify-between items-center">
                        <Button
                          variant="outline"
                          onClick={() => handleChangePage(-1)}
                          disabled={currentPage <= 1}
                        >
                          Previous Page
                        </Button>
                        
                        <Button
                          variant="outline"
                          onClick={() => handleChangePage(1)}
                        >
                          Next Page
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      No document selected
                    </div>
                  )}
                </CardContent>
              </Card>
              
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
                          onClick={() => {
                            setCurrentDocument(doc);
                            setCurrentPage(1);
                          }}
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
                    onSaveTag={handleSaveTag}
                    onDeleteTag={handleDeleteTag}
                    onSelectTag={handleSelectTag}
                  />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button 
                      onClick={handleExtractText} 
                      disabled={isProcessing || documents.length === 0 || tags.length === 0}
                      className="w-full"
                    >
                      {isProcessing ? 'Processing...' : 'Extract Text from All Documents'}
                    </Button>
                    
                    <Button
                      variant="secondary"
                      onClick={() => setActiveTab('results')}
                      disabled={results.length === 0}
                      className="w-full"
                    >
                      View Results
                    </Button>
                    
                    <Button 
                      variant="destructive" 
                      onClick={handleClearAll}
                      className="w-full"
                    >
                      Clear All Data
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="results" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Extraction Results</CardTitle>
              <CardDescription>
                View and export extracted text from your documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResultsTable results={results} />
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => setActiveTab('create-tag')}
              >
                Back to Tags
              </Button>
              
              <Button
                onClick={handleExtractText}
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : 'Refresh Extraction'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Index;
