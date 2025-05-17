
import React, { useState } from 'react';
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

interface ResultsTableProps {
  results: ExtractionResult[];
}

const ResultsTable: React.FC<ResultsTableProps> = ({ results }) => {
  const [sortColumn, setSortColumn] = useState<keyof ExtractionResult>('fileName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (column: keyof ExtractionResult) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedResults = [...results].sort((a, b) => {
    if (a[sortColumn] < b[sortColumn]) {
      return sortDirection === 'asc' ? -1 : 1;
    }
    if (a[sortColumn] > b[sortColumn]) {
      return sortDirection === 'asc' ? 1 : -1;
    }
    return 0;
  });

  const exportToCsv = () => {
    if (results.length === 0) return;

    const headers = ['File Name', 'Page', 'Tag Name', 'Extracted Text'];
    
    const csvRows = [
      headers.join(','),
      ...sortedResults.map(result => 
        [
          `"${result.fileName}"`,
          result.pageNumber,
          `"${result.tagName}"`,
          `"${result.extractedText.replace(/"/g, '""')}"`
        ].join(',')
      )
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

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer"
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
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort('tagName')}
              >
                Tag Name {sortColumn === 'tagName' && (sortDirection === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead>Extracted Text</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedResults.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-6 text-gray-500">
                  No extraction results yet
                </TableCell>
              </TableRow>
            ) : (
              sortedResults.map((result) => (
                <TableRow key={result.id}>
                  <TableCell className="font-medium max-w-xs truncate">
                    {result.fileName}
                  </TableCell>
                  <TableCell>{result.pageNumber}</TableCell>
                  <TableCell>{result.tagName}</TableCell>
                  <TableCell>{result.extractedText}</TableCell>
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
