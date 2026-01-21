'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  Search,
  MoreHorizontal,
  Upload,
  Download,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Building2,
  Edit,
  Trash2,
  Filter,
} from 'lucide-react';
import type { Transaction } from '@/types';

// Demo transactions
const demoTransactions: Transaction[] = [
  {
    id: '1',
    property_id: '1',
    date: '2024-01-15',
    amount: 1850,
    type: 'income',
    category: 'Rent',
    description: 'January rent - 789 Elm St',
    vendor: null,
    imported_from: 'manual',
    external_id: null,
    created_at: '2024-01-15T00:00:00Z',
  },
  {
    id: '2',
    property_id: '1',
    date: '2024-01-15',
    amount: 1445.23,
    type: 'expense',
    category: 'Mortgage',
    description: 'January mortgage payment',
    vendor: 'PNC Bank',
    imported_from: 'csv',
    external_id: null,
    created_at: '2024-01-15T00:00:00Z',
  },
  {
    id: '3',
    property_id: '1',
    date: '2024-01-10',
    amount: 150,
    type: 'expense',
    category: 'Maintenance',
    description: 'HVAC filter replacement',
    vendor: 'ABC Heating',
    imported_from: 'manual',
    external_id: null,
    created_at: '2024-01-10T00:00:00Z',
  },
  {
    id: '4',
    property_id: '1',
    date: '2024-01-05',
    amount: 125.50,
    type: 'expense',
    category: 'Insurance',
    description: 'Monthly insurance premium',
    vendor: 'State Farm',
    imported_from: 'csv',
    external_id: null,
    created_at: '2024-01-05T00:00:00Z',
  },
  {
    id: '5',
    property_id: null,
    date: '2024-01-03',
    amount: 45.00,
    type: 'expense',
    category: 'Supplies',
    description: 'Office supplies',
    vendor: 'Office Depot',
    imported_from: 'manual',
    external_id: null,
    created_at: '2024-01-03T00:00:00Z',
  },
];

export default function BankingPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('this_month');

  const transactions = demoTransactions.filter((tx) => {
    const matchesSearch =
      tx.description?.toLowerCase().includes(search.toLowerCase()) ||
      tx.category.toLowerCase().includes(search.toLowerCase()) ||
      tx.vendor?.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || tx.type === typeFilter;
    const matchesCategory = categoryFilter === 'all' || tx.category === categoryFilter;
    return matchesSearch && matchesType && matchesCategory;
  });

  const totalIncome = transactions
    .filter((tx) => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalExpenses = transactions
    .filter((tx) => tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const netCashFlow = totalIncome - totalExpenses;

  const categories = Array.from(new Set(demoTransactions.map((tx) => tx.category)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Banking</h1>
          <p className="text-muted-foreground">
            Track income and expenses for your properties
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/banking/import">
              <Upload className="mr-2 h-4 w-4" />
              Import CSV
            </Link>
          </Button>
          <Button asChild>
            <Link href="/banking/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Transaction
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              +${totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              -${totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Cash Flow</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {netCashFlow >= 0 ? '+' : ''}${netCashFlow.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transactions.length}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Transactions</CardTitle>
              <CardDescription>All income and expense transactions</CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="this_month">This Month</SelectItem>
                  <SelectItem value="last_month">Last Month</SelectItem>
                  <SelectItem value="this_quarter">This Quarter</SelectItem>
                  <SelectItem value="this_year">This Year</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {transactions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>{new Date(tx.date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{tx.description}</p>
                        {tx.vendor && (
                          <p className="text-sm text-muted-foreground">{tx.vendor}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{tx.category}</Badge>
                    </TableCell>
                    <TableCell>
                      {tx.property_id ? (
                        <Link
                          href={`/properties/${tx.property_id}`}
                          className="text-sm text-primary hover:underline"
                        >
                          789 Elm St
                        </Link>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {tx.imported_from}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className={`text-right font-medium ${
                        tx.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : '-'}$
                      {tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <DollarSign className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium">No transactions found</h3>
              <p className="text-sm text-muted-foreground">
                {search || typeFilter !== 'all' || categoryFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Add your first transaction or import from CSV'}
              </p>
              <div className="mt-4 flex gap-2">
                <Button variant="outline" asChild>
                  <Link href="/banking/import">
                    <Upload className="mr-2 h-4 w-4" />
                    Import CSV
                  </Link>
                </Button>
                <Button asChild>
                  <Link href="/banking/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Transaction
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
