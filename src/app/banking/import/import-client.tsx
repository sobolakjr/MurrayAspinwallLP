'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
} from 'lucide-react';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '@/types';
import type { Property } from '@/types';
import { importTransactionsAction } from '../actions';

interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  selected: boolean;
}

interface ImportClientProps {
  properties: Property[];
}

export function ImportClient({ properties }: ImportClientProps) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isParsed, setIsParsed] = useState(false);
  const [transactions, setTransactions] = useState<ParsedTransaction[]>([]);
  const [propertyId, setPropertyId] = useState<string>('none');
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setIsParsed(false);
      setTransactions([]);
      setError(null);
    }
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const parseDate = (dateStr: string): string | null => {
    // Try MM/DD/YYYY or MM/DD/YY
    const slashMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
    if (slashMatch) {
      const [, m, d, y] = slashMatch;
      const year = y.length === 2 ? `20${y}` : y;
      return `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
    // Try YYYY-MM-DD
    const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
      return dateStr;
    }
    return null;
  };

  const parseAmount = (str: string): { amount: number; isNegative: boolean } => {
    if (!str) return { amount: 0, isNegative: false };
    // Handle PNC format like "- $155000" or "+ $1250"
    const isNegative = str.includes('-');
    const cleaned = str.replace(/[$,\s+-]/g, '');
    const num = parseFloat(cleaned);
    return { amount: isNaN(num) ? 0 : Math.abs(num), isNegative };
  };

  const parseCSV = (text: string): ParsedTransaction[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headerLine = lines[0];
    const headers = parseCSVLine(headerLine).map(h => h.toLowerCase().replace(/['"]/g, ''));

    // Find column indices for common bank formats
    const dateIdx = headers.findIndex(h => h.includes('date'));
    const descIdx = headers.findIndex(h => h.includes('description') || h.includes('memo') || h.includes('payee'));
    const amountIdx = headers.findIndex(h => h === 'amount' || h.includes('transaction amount') || (h === 'amount' && !headers.some(x => x.includes('debit') || x.includes('credit'))));
    const debitIdx = headers.findIndex(h => h.includes('debit') || h.includes('withdrawal') || h.includes('withdrawals'));
    const creditIdx = headers.findIndex(h => h.includes('credit') || h.includes('deposit') || h.includes('deposits'));
    const balanceIdx = headers.findIndex(h => h.includes('balance'));

    // Check if this is PNC format (has single Amount column with +/- prefix)
    const isPNCFormat = amountIdx !== -1 && debitIdx === -1 && creditIdx === -1;

    // Debug: if no recognized columns, try generic parsing
    const hasKnownColumns = dateIdx !== -1 || descIdx !== -1 || amountIdx !== -1 || debitIdx !== -1 || creditIdx !== -1;

    const parsed: ParsedTransaction[] = [];

    for (let i = 1; i < lines.length; i++) {
      const parts = parseCSVLine(lines[i]);
      if (parts.length < 2) continue;

      let date = '';
      let description = '';
      let amount = 0;
      let type: 'income' | 'expense' = 'expense';

      if (hasKnownColumns) {
        // Use column indices
        if (dateIdx !== -1 && parts[dateIdx]) {
          date = parseDate(parts[dateIdx]) || '';
        }

        if (descIdx !== -1 && parts[descIdx]) {
          description = parts[descIdx].replace(/^"|"$/g, '');
        }

        // Check for separate debit/credit columns
        if (debitIdx !== -1 || creditIdx !== -1) {
          const debitResult = debitIdx !== -1 ? parseAmount(parts[debitIdx]) : { amount: 0, isNegative: false };
          const creditResult = creditIdx !== -1 ? parseAmount(parts[creditIdx]) : { amount: 0, isNegative: false };

          if (creditResult.amount > 0) {
            amount = creditResult.amount;
            type = 'income';
          } else if (debitResult.amount > 0) {
            amount = debitResult.amount;
            type = 'expense';
          }
        }
        // Check for single amount column (PNC format with +/- prefix like "- $155000" or "+ $1250")
        else if (amountIdx !== -1 && parts[amountIdx]) {
          const result = parseAmount(parts[amountIdx]);
          amount = result.amount;
          // In PNC format: "-" means withdrawal/expense, "+" means deposit/income
          type = result.isNegative ? 'expense' : 'income';
        }
      } else {
        // Generic parsing - look for date and amounts in each part
        for (const part of parts) {
          if (!date) {
            const parsedDate = parseDate(part);
            if (parsedDate) {
              date = parsedDate;
              continue;
            }
          }

          // Try to parse as amount (handles formats like "- $155000" or "$1250")
          if (!amount) {
            const result = parseAmount(part);
            if (result.amount > 0) {
              amount = result.amount;
              type = result.isNegative ? 'expense' : 'income';
              continue;
            }
          }

          if (!description && part.length > 3 && !parseDate(part)) {
            description = part;
          }
        }

        // If no description found, use the longest non-numeric part
        if (!description) {
          description = parts.reduce((a, b) => {
            const aIsNum = /^-?\d*\.?\d+$/.test(a.replace(/[$,\s+-]/g, ''));
            const bIsNum = /^-?\d*\.?\d+$/.test(b.replace(/[$,\s+-]/g, ''));
            if (aIsNum && !bIsNum) return b;
            if (!aIsNum && bIsNum) return a;
            return a.length > b.length ? a : b;
          }, '');
        }
      }

      if (date && description && amount > 0) {
        // Auto-categorize based on description
        const descLower = description.toLowerCase();
        let category = type === 'income' ? 'Other Income' : 'Other Expense';

        if (descLower.includes('rent') || descLower.includes('tenant')) {
          category = 'Rent';
          type = 'income';
        } else if (descLower.includes('zelle') || descLower.includes('venmo') || descLower.includes('transfer from')) {
          category = 'Other Income';
          type = 'income';
        } else if (descLower.includes('mortgage') || descLower.includes('loan pmt') || descLower.includes('rocket')) {
          category = 'Mortgage';
          type = 'expense';
        } else if (descLower.includes('insurance') || descLower.includes('allstate') || descLower.includes('state farm') || descLower.includes('geico')) {
          category = 'Insurance';
          type = 'expense';
        } else if (descLower.includes('home depot') || descLower.includes('lowes') || descLower.includes('menards') || descLower.includes('repair')) {
          category = 'Repairs';
          type = 'expense';
        } else if (descLower.includes('electric') || descLower.includes('gas') || descLower.includes('water') || descLower.includes('utility') || descLower.includes('duke energy') || descLower.includes('aep')) {
          category = 'Utilities';
          type = 'expense';
        } else if (descLower.includes('tax') || descLower.includes('county treasurer')) {
          category = 'Property Tax';
          type = 'expense';
        } else if (descLower.includes('hoa') || descLower.includes('association')) {
          category = 'HOA';
          type = 'expense';
        }

        parsed.push({
          date,
          description,
          amount,
          type,
          category,
          selected: true,
        });
      }
    }

    return parsed;
  };

  const handleParse = async () => {
    if (!file) return;

    setIsProcessing(true);
    setError(null);

    try {
      const text = await file.text();
      const parsed = parseCSV(text);

      if (parsed.length === 0) {
        setError('Could not parse any transactions from the file. Please check the CSV format.');
      } else {
        setTransactions(parsed);
        setIsParsed(true);
      }
    } catch (err) {
      setError('Failed to read the file. Please try again.');
    } finally {
      setIsProcessing(false);
    }
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
    if (selectedTransactions.length === 0) return;

    setIsImporting(true);
    setError(null);

    try {
      const result = await importTransactionsAction(
        selectedTransactions.map((tx) => ({
          property_id: propertyId === 'none' ? null : propertyId,
          date: tx.date,
          amount: tx.amount,
          type: tx.type,
          category: tx.category,
          description: tx.description,
        }))
      );

      if (result.success) {
        router.push('/banking');
      } else {
        setError(result.error || 'Failed to import transactions');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsImporting(false);
    }
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

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-start gap-4 pt-6">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-red-900">Error</h4>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

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
                  <SelectItem value="none">No Property (General)</SelectItem>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.address}
                    </SelectItem>
                  ))}
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
              <Button onClick={handleImport} disabled={selectedCount === 0 || isImporting}>
                {isImporting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}
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
