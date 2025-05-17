
import React, { useState, useMemo } from 'react';
import { ExtractionResult } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ResultsTableProps {
  results: ExtractionResult[];
}

const ResultsTable: React.FC<ResultsTableProps> = ({ results }) => {
  const [sortColumn, setSortColumn] = useState<string>('fileName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Transform results into document-based rows with columns for each tag
  const { documentRows, uniqueTags } = useMemo(() => {
    // Get unique tags
    const tags = [...new Set(results.map(result => result.tagName))];
    
    // Group results by document
    const documentMap = new Map<string, any>();
    
    results.forEach(result => {
      const key = `${result.documentId}-${result.pageNumber}`;
      
      if (!documentMap.has(key)) {
        documentMap.set(key, {
          id: key,
          documentId: result.documentId,
          fileName: result.fileName,
          pageNumber: result.pageNumber,
          tags: {},
          errors: {},
          // Store the full results with metadata for potential future use
          fullResults: {}
        });
      }
      
      // Add this tag's extracted text to the document
      documentMap.get(key).tags[result.tagName] = result.extractedText;
      
      // Store error code if present
      if (result.errorCode) {
        documentMap.get(key).errors[result.tagName] = result.errorCode;
      }
      
      // Store the full result object including metadata
      documentMap.get(key).fullResults[result.tagName] = result;
    });
    
    return {
      documentRows: Array.from(documentMap.values()),
      uniqueTags: tags
    };
  }, [results]);

  // Sort the document rows
  const sortedRows = useMemo(() => {
    return [...documentRows].sort((a, b) => {
      if (sortColumn === 'fileName' || sortColumn === 'pageNumber') {
        if (a[sortColumn] < b[sortColumn]) {
          return sortDirection === 'asc' ? -1 : 1;
        }
        if (a[sortColumn] > b[sortColumn]) {
          return sortDirection === 'asc' ? 1 : -1;
        }
        return 0;
      } else {
        // Sorting by tag column
        const aValue = a.tags[sortColumn] || '';
        const bValue = b.tags[sortColumn] || '';
        
        if (aValue < bValue) {
          return sortDirection === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortDirection === 'asc' ? 1 : -1;
        }
        return 0;
      }
    });
  }, [documentRows, sortColumn, sortDirection]);

  const exportToCsv = () => {
    if (results.length === 0) return;

    // Include all tag columns in the header
    const headers = ['File Name', 'Page', ...uniqueTags];
    
    const csvRows = [
      headers.join(','),
      ...sortedRows.map(row => {
        const cells = [
          `"${row.fileName}"`,
          row.pageNumber
        ];
        
        // Add cells for each tag
        for (const tag of uniqueTags) {
          const text = row.tags[tag] || '';
          cells.push(`"${text.replace(/"/g, '""')}"`);
        }
        
        return cells.join(',');
      })
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'extraction-results.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('CSV file downloaded');
  };

  // Render appropriate content for a cell based on the text value and error status
  const renderCellContent = (text: string, errorCode?: string) => {
    if (!text) return '';
    
    // Check for error messages
    if (text.startsWith('[Error') || text.startsWith('[No text')) {
      return (
        <div className="flex items-center text-amber-700">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="flex items-center">
                  <Info className="w-4 h-4 mr-1" />
                  {text}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  {errorCode === 'NO_TEXT_CONTENT' && 
                    "This document doesn't contain any extractable text. It may be a scanned or image-based PDF that requires OCR processing."
                  }
                  {errorCode === 'EMPTY_REGION' && 
                    "No text was found in this tag region. Try adjusting the tag position to better cover the text."
                  }
                  {errorCode === 'PROCESSING_ERROR' && 
                    "An error occurred while processing this document. Check the console for more details."
                  }
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      );
    }
    
    return text;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Extraction Results</h2>
        
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={exportToCsv}>
                Download as CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer whitespace-nowrap"
                onClick={() => handleSort('fileName')}
              >
                File Name {sortColumn === 'fileName' && (sortDirection === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead 
                className="cursor-pointer w-20"
                onClick={() => handleSort('pageNumber')}
              >
                Page {sortColumn === 'pageNumber' && (sortDirection === 'asc' ? '↑' : '↓')}
              </TableHead>
              
              {/* Create a column for each unique tag */}
              {uniqueTags.map(tag => (
                <TableHead 
                  key={tag}
                  className="cursor-pointer whitespace-nowrap"
                  onClick={() => handleSort(tag)}
                >
                  {tag} {sortColumn === tag && (sortDirection === 'asc' ? '↑' : '↓')}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2 + uniqueTags.length} className="text-center py-6 text-gray-500">
                  No extraction results yet
                </TableCell>
              </TableRow>
            ) : (
              sortedRows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium max-w-xs truncate">
                    {row.fileName}
                  </TableCell>
                  <TableCell>{row.pageNumber}</TableCell>
                  
                  {/* Add cells for each tag */}
                  {uniqueTags.map(tag => (
                    <TableCell key={`${row.id}-${tag}`}>
                      {renderCellContent(row.tags[tag] || '', row.errors[tag])}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ResultsTable;
