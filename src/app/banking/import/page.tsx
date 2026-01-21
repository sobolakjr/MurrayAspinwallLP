'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft,
  Upload,
  FileText,
  Check,
  AlertCircle,
  Loader2,
  Download,
} from 'lucide-react';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '@/types';

interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  selected: boolean;
}

// Demo parsed transactions (simulating CSV import)
const demoParsedData: ParsedTransaction[] = [
  {
    date: '2024-01-15',
    description: 'MORTGAGE PAYMENT - LOAN 12345',
    amount: 1445.23,
    type: 'expense',
    category: 'Mortgage',
    selected: true,
  },
  {
    date: '2024-01-12',
    description: 'STATE FARM INSURANCE',
    amount: 125.50,
    type: 'expense',
    category: 'Insurance',
    selected: true,
  },
  {
    date: '2024-01-10',
    description: 'TRANSFER FROM TENANT J SMITH',
    amount: 1850.00,
    type: 'income',
    category: 'Rent',
    selected: true,
  },
  {
    date: '2024-01-08',
    description: 'HOME DEPOT #1234',
    amount: 87.43,
    type: 'expense',
    category: 'Repairs',
    selected: true,
  },
  {
    date: '2024-01-05',
    description: 'AMAZON PURCHASE',
    amount: 45.99,
    type: 'expense',
    category: 'Supplies',
    selected: false,
  },
];

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isParsed, setIsParsed] = useState(false);
  const [transactions, setTransactions] = useState<ParsedTransaction[]>([]);
  const [propertyId, setPropertyId] = useState<string>('1');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setIsParsed(false);
      setTransactions([]);
    }
  };

  const handleParse = async () => {
    if (!file) return;

    setIsProcessing(true);

    // Simulate parsing delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Use demo data for now
    setTransactions(demoParsedData);
    setIsParsed(true);
    setIsProcessing(false);
  };

  const toggleTransaction = (index: number) => {
    setTransactions((prev) =>
      prev.map((tx, i) =>
        i === index ? { ...tx, selected: !tx.selected } : tx
      )
    );
  };

  const updateCategory = (index: number, category: string) => {
    setTransactions((prev) =>
      prev.map((tx, i) =>
        i === index ? { ...tx, category } : tx
      )
    );
  };

  const updateType = (index: number, type: 'income' | 'expense') => {
    setTransactions((prev) =>
      prev.map((tx, i) =>
        i === index ? { ...tx, type } : tx
      )
    );
  };

  const handleImport = async () => {
    const selectedTransactions = transactions.filter((tx) => tx.selected);
    // TODO: Save to Supabase
    alert(`Imported ${selectedTransactions.length} transactions!`);
  };

  const selectedCount = transactions.filter((tx) => tx.selected).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/banking">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Import Transactions</h1>
          <p className="text-muted-foreground">
            Upload a CSV file from your bank to import transactions
          </p>
        </div>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>CSV Import Instructions</CardTitle>
          <CardDescription>
            Follow these steps to import transactions from PNC or other banks
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Log in to your PNC online banking account</li>
            <li>Navigate to Account Activity or Statements</li>
            <li>Select the date range you want to export</li>
            <li>Download as CSV format</li>
            <li>Upload the file below</li>
          </ol>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <span>
              Supported banks: PNC, Chase, Bank of America, Wells Fargo, and most CSV formats
            </span>
          </div>
        </CardContent>
      </Card>

      {/* File Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Upload CSV File</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>CSV File</Label>
              <div className="flex gap-2">
                <Input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="flex-1"
                />
              </div>
              {file && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Assign to Property</Label>
              <Select value={propertyId} onValueChange={setPropertyId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">789 Elm Street</SelectItem>
                  <SelectItem value="none">No Property (General)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleParse} disabled={!file || isProcessing}>
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Parse CSV
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Parsed Transactions */}
      {isParsed && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Review Transactions</CardTitle>
                <CardDescription>
                  {selectedCount} of {transactions.length} transactions selected for import
                </CardDescription>
              </div>
              <Button onClick={handleImport} disabled={selectedCount === 0}>
                <Check className="mr-2 h-4 w-4" />
                Import {selectedCount} Transactions
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">Include</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx, index) => (
                  <TableRow key={index} className={!tx.selected ? 'opacity-50' : ''}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={tx.selected}
                        onChange={() => toggleTransaction(index)}
                        className="h-4 w-4"
                      />
                    </TableCell>
                    <TableCell>{new Date(tx.date).toLocaleDateString()}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {tx.description}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={tx.type}
                        onValueChange={(value) => updateType(index, value as 'income' | 'expense')}
                      >
                        <SelectTrigger className="w-[100px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="income">Income</SelectItem>
                          <SelectItem value="expense">Expense</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={tx.category}
                        onValueChange={(value) => updateCategory(index, value)}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="" disabled>
                            -- Income --
                          </SelectItem>
                          {INCOME_CATEGORIES.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                          <SelectItem value="" disabled>
                            -- Expense --
                          </SelectItem>
                          {EXPENSE_CATEGORIES.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell
                      className={`text-right font-medium ${
                        tx.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : '-'}$
                      {tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
