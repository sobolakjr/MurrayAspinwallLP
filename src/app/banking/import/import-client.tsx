'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
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
  X,
  AlertTriangle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '@/types';
import type { Property, BankAccount, Transaction } from '@/types';
import { importTransactionsAction } from '../actions';

interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  selected: boolean;
  property_id: string;
  memo: string;
  isDuplicate: boolean;
}

interface ImportClientProps {
  properties: Property[];
  bankAccounts: BankAccount[];
  existingTransactions: Transaction[];
}

export function ImportClient({ properties, bankAccounts, existingTransactions }: ImportClientProps) {
  // Create a Set of existing transaction signatures for fast duplicate lookup
  const existingSignatures = new Set(
    existingTransactions.map((tx) => `${tx.date}|${tx.amount}|${tx.type}`)
  );
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isParsed, setIsParsed] = useState(false);
  const [transactions, setTransactions] = useState<ParsedTransaction[]>([]);
  const [propertyId, setPropertyId] = useState<string>('none');
  const [bankAccountId, setBankAccountId] = useState<string>('none');
  const [error, setError] = useState<string | null>(null);
  const [checkedRows, setCheckedRows] = useState<Set<number>>(new Set());
  const [bulkPropertyId, setBulkPropertyId] = useState<string>('none');
  const [bulkCategory, setBulkCategory] = useState<string>('');
  const [bulkMemo, setBulkMemo] = useState<string>('');

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

        // Check if this is a potential duplicate
        const signature = `${date}|${amount}|${type}`;
        const isDuplicate = existingSignatures.has(signature);

        parsed.push({
          date,
          description,
          amount,
          type,
          category,
          selected: !isDuplicate, // Auto-deselect duplicates
          property_id: 'none',
          memo: '',
          isDuplicate,
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
        // Apply the default property selection to all parsed transactions
        const withProperty = parsed.map((tx) => ({ ...tx, property_id: propertyId }));
        setTransactions(withProperty);
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

  const updateProperty = (index: number, property_id: string) => {
    setTransactions((prev) =>
      prev.map((tx, i) =>
        i === index ? { ...tx, property_id } : tx
      )
    );
  };

  const updateAllProperties = (property_id: string) => {
    setTransactions((prev) =>
      prev.map((tx) => ({ ...tx, property_id }))
    );
  };

  const toggleChecked = (index: number) => {
    setCheckedRows((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const toggleAllChecked = () => {
    if (checkedRows.size === transactions.length) {
      setCheckedRows(new Set());
    } else {
      setCheckedRows(new Set(transactions.map((_, i) => i)));
    }
  };

  const clearChecked = () => {
    setCheckedRows(new Set());
  };

  const updateMemo = (index: number, memo: string) => {
    setTransactions((prev) =>
      prev.map((tx, i) =>
        i === index ? { ...tx, memo } : tx
      )
    );
  };

  const applyPropertyToChecked = (property_id: string) => {
    setTransactions((prev) =>
      prev.map((tx, i) =>
        checkedRows.has(i) ? { ...tx, property_id } : tx
      )
    );
    setBulkPropertyId('none');
  };

  const applyCategoryToChecked = (category: string) => {
    if (!category) return;
    setTransactions((prev) =>
      prev.map((tx, i) =>
        checkedRows.has(i) ? { ...tx, category } : tx
      )
    );
    setBulkCategory('');
  };

  const applyMemoToChecked = (memo: string) => {
    setTransactions((prev) =>
      prev.map((tx, i) =>
        checkedRows.has(i) ? { ...tx, memo } : tx
      )
    );
    setBulkMemo('');
  };

  const applyAllToChecked = () => {
    setTransactions((prev) =>
      prev.map((tx, i) => {
        if (!checkedRows.has(i)) return tx;
        return {
          ...tx,
          property_id: bulkPropertyId !== 'none' ? bulkPropertyId : tx.property_id,
          category: bulkCategory || tx.category,
          memo: bulkMemo || tx.memo,
        };
      })
    );
    // Reset bulk fields after applying
    setBulkPropertyId('none');
    setBulkCategory('');
    setBulkMemo('');
  };

  const hasBulkSettings = bulkPropertyId !== 'none' || bulkCategory !== '';

  const handleImport = async () => {
    const selectedTransactions = transactions.filter((tx) => tx.selected);
    if (selectedTransactions.length === 0) return;

    setIsImporting(true);
    setError(null);

    try {
      const result = await importTransactionsAction(
        selectedTransactions.map((tx) => ({
          property_id: tx.property_id === 'none' ? null : tx.property_id,
          date: tx.date,
          amount: tx.amount,
          type: tx.type,
          category: tx.category,
          description: tx.memo ? `${tx.description} | ${tx.memo}` : tx.description,
        })),
        bankAccountId === 'none' ? null : bankAccountId
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
  const duplicateCount = transactions.filter((tx) => tx.isDuplicate).length;

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
            Follow these steps to export and import transactions from your bank
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="pnc">PNC</TabsTrigger>
              <TabsTrigger value="chase">Chase</TabsTrigger>
              <TabsTrigger value="bofa">Bank of America</TabsTrigger>
              <TabsTrigger value="wells">Wells Fargo</TabsTrigger>
              <TabsTrigger value="other">Other Banks</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="space-y-3">
                <h4 className="font-medium">How It Works</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Download a CSV export from your bank&apos;s website</li>
                  <li>Upload the file using the form below</li>
                  <li>Review and categorize the transactions</li>
                  <li>Assign transactions to properties (optional)</li>
                  <li>Add memos for additional context (optional)</li>
                  <li>Import the selected transactions</li>
                </ol>
              </div>
              <div className="space-y-3">
                <h4 className="font-medium">Features</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li><strong>Auto-categorization:</strong> Common transactions are automatically categorized</li>
                  <li><strong>Duplicate detection:</strong> Previously imported transactions are flagged and auto-deselected</li>
                  <li><strong>Bulk editing:</strong> Select multiple rows to apply property, category, or memo at once</li>
                  <li><strong>Per-transaction editing:</strong> Fine-tune each transaction individually</li>
                </ul>
              </div>
              <div className="flex items-center gap-2 text-sm bg-blue-50 p-3 rounded-lg">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <span className="text-blue-800">
                  Supported formats: PNC, Chase, Bank of America, Wells Fargo, and most standard CSV formats with Date, Description, and Amount columns.
                </span>
              </div>
            </TabsContent>

            <TabsContent value="pnc" className="space-y-4">
              <h4 className="font-medium">PNC Bank Export Instructions</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Log in to <strong>pnc.com</strong></li>
                <li>Click on your account to view activity</li>
                <li>Click <strong>&quot;Download&quot;</strong> or <strong>&quot;Export&quot;</strong> button (usually top right)</li>
                <li>Select date range (up to 18 months)</li>
                <li>Choose <strong>&quot;CSV&quot;</strong> or <strong>&quot;Spreadsheet (CSV)&quot;</strong> format</li>
                <li>Click <strong>&quot;Download&quot;</strong></li>
              </ol>
              <div className="bg-muted p-3 rounded-lg text-sm">
                <strong>PNC CSV Format:</strong> Date, Description, Withdrawals, Deposits, Balance
                <br />
                <span className="text-muted-foreground">Or: Date, Description, Amount (with +/- prefix)</span>
              </div>
            </TabsContent>

            <TabsContent value="chase" className="space-y-4">
              <h4 className="font-medium">Chase Bank Export Instructions</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Log in to <strong>chase.com</strong></li>
                <li>Go to your account and click <strong>&quot;See activity&quot;</strong></li>
                <li>Click the <strong>download icon</strong> (arrow pointing down)</li>
                <li>Select <strong>&quot;Transactions&quot;</strong></li>
                <li>Choose your date range</li>
                <li>Select <strong>&quot;CSV&quot;</strong> file type</li>
                <li>Click <strong>&quot;Download&quot;</strong></li>
              </ol>
              <div className="bg-muted p-3 rounded-lg text-sm">
                <strong>Chase CSV Format:</strong> Transaction Date, Post Date, Description, Category, Type, Amount, Memo
              </div>
            </TabsContent>

            <TabsContent value="bofa" className="space-y-4">
              <h4 className="font-medium">Bank of America Export Instructions</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Log in to <strong>bankofamerica.com</strong></li>
                <li>Select your account</li>
                <li>Click <strong>&quot;Download transactions&quot;</strong> link</li>
                <li>Select the date range</li>
                <li>Choose <strong>&quot;Microsoft Excel or CSV&quot;</strong></li>
                <li>Click <strong>&quot;Download&quot;</strong></li>
              </ol>
              <div className="bg-muted p-3 rounded-lg text-sm">
                <strong>BofA CSV Format:</strong> Date, Description, Amount, Running Balance
              </div>
            </TabsContent>

            <TabsContent value="wells" className="space-y-4">
              <h4 className="font-medium">Wells Fargo Export Instructions</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Log in to <strong>wellsfargo.com</strong></li>
                <li>Go to <strong>&quot;Account Activity&quot;</strong></li>
                <li>Click <strong>&quot;Download Account Activity&quot;</strong></li>
                <li>Select the date range</li>
                <li>Choose <strong>&quot;Comma Delimited (.csv)&quot;</strong></li>
                <li>Click <strong>&quot;Download&quot;</strong></li>
              </ol>
              <div className="bg-muted p-3 rounded-lg text-sm">
                <strong>Wells Fargo CSV Format:</strong> Date, Amount, *, *, Description
              </div>
            </TabsContent>

            <TabsContent value="other" className="space-y-4">
              <h4 className="font-medium">Other Banks &amp; Generic CSV</h4>
              <p className="text-sm text-muted-foreground">
                Most banks offer CSV export. Look for &quot;Download&quot;, &quot;Export&quot;, or &quot;Download Activity&quot; options in your account.
              </p>
              <div className="space-y-3">
                <h5 className="font-medium text-sm">Required Columns</h5>
                <p className="text-sm text-muted-foreground">Your CSV should have these columns (names can vary):</p>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li><strong>Date:</strong> Transaction date (MM/DD/YYYY or YYYY-MM-DD)</li>
                  <li><strong>Description/Memo/Payee:</strong> Transaction description</li>
                  <li><strong>Amount:</strong> Single amount column, OR separate Debit/Credit columns</li>
                </ul>
              </div>
              <div className="bg-amber-50 p-3 rounded-lg text-sm">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                  <span className="text-amber-800">
                    If your bank&apos;s format isn&apos;t recognized, try renaming columns to: Date, Description, Amount (or Debit/Credit).
                  </span>
                </div>
              </div>
            </TabsContent>
          </Tabs>
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
          <div className="grid gap-4 md:grid-cols-3">
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
              <Label>Bank Account</Label>
              <Select value={bankAccountId} onValueChange={setBankAccountId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Account</SelectItem>
                  {bankAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Set All Properties To</Label>
              <Select
                value={propertyId}
                onValueChange={(value) => {
                  setPropertyId(value);
                  if (isParsed) {
                    updateAllProperties(value);
                  }
                }}
              >
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
              <p className="text-xs text-muted-foreground">
                Edit per transaction below after parsing
              </p>
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
                  {duplicateCount > 0 && (
                    <span className="ml-2 text-amber-600">
                      ({duplicateCount} potential duplicate{duplicateCount > 1 ? 's' : ''} auto-deselected)
                    </span>
                  )}
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
          <CardContent className="space-y-4">
            {/* Bulk Action Bar */}
            {checkedRows.size > 0 && (
              <div className="flex flex-col gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-900">
                    {checkedRows.size} transaction{checkedRows.size > 1 ? 's' : ''} selected
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearChecked}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear Selection
                  </Button>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {/* Bulk Property */}
                  <div className="flex items-center gap-2">
                    <Label className="text-sm text-blue-700 whitespace-nowrap">Property:</Label>
                    <Select
                      value={bulkPropertyId}
                      onValueChange={setBulkPropertyId}
                    >
                      <SelectTrigger className="w-[160px] bg-white">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Property</SelectItem>
                        {properties.map((property) => (
                          <SelectItem key={property.id} value={property.id}>
                            {property.address}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Bulk Category */}
                  <div className="flex items-center gap-2">
                    <Label className="text-sm text-blue-700 whitespace-nowrap">Category:</Label>
                    <Select
                      value={bulkCategory}
                      onValueChange={setBulkCategory}
                    >
                      <SelectTrigger className="w-[140px] bg-white">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Income</SelectLabel>
                          {INCOME_CATEGORIES.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                        <SelectGroup>
                          <SelectLabel>Expense</SelectLabel>
                          {EXPENSE_CATEGORIES.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Bulk Memo (optional) */}
                  <div className="flex items-center gap-2">
                    <Label className="text-sm text-blue-700 whitespace-nowrap">Memo:</Label>
                    <Input
                      value={bulkMemo}
                      onChange={(e) => setBulkMemo(e.target.value)}
                      placeholder="Optional..."
                      className="w-[140px] bg-white"
                    />
                  </div>

                  {/* Single Apply Button */}
                  <Button
                    size="sm"
                    onClick={applyAllToChecked}
                    disabled={!hasBulkSettings}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Apply to Selected
                  </Button>
                </div>
              </div>
            )}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">
                    <Checkbox
                      checked={checkedRows.size === transactions.length && transactions.length > 0}
                      onCheckedChange={toggleAllChecked}
                    />
                  </TableHead>
                  <TableHead className="w-[50px]">Include</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Memo</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx, index) => (
                  <TableRow
                    key={index}
                    className={`${!tx.selected ? 'opacity-50' : ''} ${tx.isDuplicate ? 'bg-amber-50' : ''}`}
                  >
                    <TableCell>
                      <Checkbox
                        checked={checkedRows.has(index)}
                        onCheckedChange={() => toggleChecked(index)}
                      />
                    </TableCell>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={tx.selected}
                        onChange={() => toggleTransaction(index)}
                        className="h-4 w-4"
                      />
                    </TableCell>
                    <TableCell>{new Date(tx.date).toLocaleDateString()}</TableCell>
                    <TableCell className="max-w-[200px]">
                      <div className="flex items-center gap-2">
                        <span className="truncate">{tx.description}</span>
                        {tx.isDuplicate && (
                          <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 text-xs whitespace-nowrap">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Duplicate
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={tx.property_id}
                        onValueChange={(value) => updateProperty(index, value)}
                      >
                        <SelectTrigger className="w-[160px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Property</SelectItem>
                          {properties.map((property) => (
                            <SelectItem key={property.id} value={property.id}>
                              {property.address}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                          <SelectGroup>
                            <SelectLabel>Income</SelectLabel>
                            {INCOME_CATEGORIES.map((cat) => (
                              <SelectItem key={cat} value={cat}>
                                {cat}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                          <SelectGroup>
                            <SelectLabel>Expense</SelectLabel>
                            {EXPENSE_CATEGORIES.map((cat) => (
                              <SelectItem key={cat} value={cat}>
                                {cat}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        value={tx.memo}
                        onChange={(e) => updateMemo(index, e.target.value)}
                        placeholder="Add memo..."
                        className="w-[120px]"
                      />
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
