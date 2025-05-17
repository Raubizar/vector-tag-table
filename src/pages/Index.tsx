
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { PDFDocument, Tag, ExtractionResult } from '@/lib/types';
import { loadPdfDocument, extractTextFromAllDocuments } from '@/lib/pdfUtils';
import { saveDocuments, saveTags, saveResults, getTags, getResults } from '@/lib/store';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from '@/components/PageHeader';
import UploadTab from '@/components/UploadTab';
import CreateTagTab from '@/components/CreateTagTab';
import ResultsTab from '@/components/ResultsTab';

const Index = () => {
  const [documents, setDocuments] = useState<PDFDocument[]>([]);
  const [currentDocument, setCurrentDocument] = useState<PDFDocument | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [currentTag, setCurrentTag] = useState<Partial<Tag> | null>(null);
  const [results, setResults] = useState<ExtractionResult[]>([]);
  const [activeTab, setActiveTab] = useState('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFirstVisit, setIsFirstVisit] = useState(true);

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

      // Set the first document as current
      if (documentsWithData.length > 0 && !currentDocument) {
        setCurrentDocument(documentsWithData[0]);
      }
      
      // If this is the first upload, immediately switch to tag creation
      if (isFirstVisit && documentsWithData.length > 0) {
        setActiveTab('create-tag');
        setIsFirstVisit(false);
        toast.info('Now create a tag by selecting an area on the document', {
          duration: 5000,
        });
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
    
    // Automatically run extraction if we have documents and at least one tag
    if (documents.length > 0 && tags.length === 0) {
      // Only auto-extract after the first tag is created
      handleExtractText();
    }
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
      
      toast.success(`Extracted ${extractionResults.length} results from the first page of each document`);
      setActiveTab('results');
    } catch (error) {
      console.error('Error extracting text:', error);
      toast.error('Failed to extract text from documents');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSelectDocument = (document: PDFDocument) => {
    setCurrentDocument(document);
  };

  const handleClearAll = () => {
    setDocuments([]);
    setCurrentDocument(null);
    setTags([]);
    setCurrentTag(null);
    setResults([]);
    setIsFirstVisit(true);
    
    // Clear local storage
    localStorage.clear();
    
    toast.info('All data cleared');
  };

  const handleTagRegionUpdate = (tagId: string, newRegion: Tag['region']) => {
    setTags(prev => 
      prev.map(tag => 
        tag.id === tagId 
          ? { ...tag, region: newRegion } 
          : tag
      )
    );
    
    // Save updated tags to storage
    const updatedTags = tags.map(tag => 
      tag.id === tagId 
        ? { ...tag, region: newRegion } 
        : tag
    );
    saveTags(updatedTags);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <PageHeader 
        title="PDF Tagging & Extraction"
        description="Upload PDF documents, create tags on the first page, and extract text data"
      />

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
          <UploadTab 
            onFilesAccepted={handleFilesAccepted}
            documentsLength={documents.length}
            onNextTab={() => setActiveTab('create-tag')}
          />
        </TabsContent>

        <TabsContent value="create-tag" className="mt-6">
          <CreateTagTab
            documents={documents}
            currentDocument={currentDocument}
            tags={tags}
            currentTag={currentTag}
            isProcessing={isProcessing}
            results={results}
            onRegionSelected={handleRegionSelected}
            onSaveTag={handleSaveTag}
            onDeleteTag={handleDeleteTag}
            onSelectTag={handleSelectTag}
            onSelectDocument={handleSelectDocument}
            onExtractText={handleExtractText}
            onViewResults={() => setActiveTab('results')}
            onClearAll={handleClearAll}
            onTagUpdated={handleTagRegionUpdate}
          />
        </TabsContent>

        <TabsContent value="results" className="mt-6">
          <ResultsTab
            results={results}
            onBackToTags={() => setActiveTab('create-tag')}
            onRefreshExtraction={handleExtractText}
            isProcessing={isProcessing}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Index;
