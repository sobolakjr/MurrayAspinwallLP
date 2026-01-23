'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
  TrendingUp,
  TrendingDown,
  DollarSign,
  Building2,
  Edit,
  Trash2,
  CreditCard,
  Landmark,
  Loader2,
} from 'lucide-react';
import type { Transaction, Property, BankAccount } from '@/types';
import { createBankAccountAction, deleteBankAccountAction } from './actions';

interface BankingClientProps {
  initialTransactions: Transaction[];
  properties: Property[];
  bankAccounts: BankAccount[];
}

export function BankingClient({ initialTransactions, properties, bankAccounts }: BankingClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [accountFilter, setAccountFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('all');
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newAccount, setNewAccount] = useState({
    name: '',
    institution: '',
    account_type: 'checking' as const,
    account_number_last4: '',
    current_balance: '',
  });

  const transactions = initialTransactions.filter((tx) => {
    const matchesSearch =
      tx.description?.toLowerCase().includes(search.toLowerCase()) ||
      tx.category.toLowerCase().includes(search.toLowerCase()) ||
      tx.vendor?.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || tx.type === typeFilter;
    const matchesCategory = categoryFilter === 'all' || tx.category === categoryFilter;
    const matchesAccount = accountFilter === 'all' || tx.bank_account_id === accountFilter;
    return matchesSearch && matchesType && matchesCategory && matchesAccount;
  });

  const totalIncome = transactions
    .filter((tx) => tx.type === 'income')
    .reduce((sum, tx) => sum + Number(tx.amount), 0);

  const totalExpenses = transactions
    .filter((tx) => tx.type === 'expense')
    .reduce((sum, tx) => sum + Number(tx.amount), 0);

  const netCashFlow = totalIncome - totalExpenses;

  const categories = Array.from(new Set(initialTransactions.map((tx) => tx.category)));

  // Create a map of property IDs to addresses
  const propertyMap = new Map(properties.map(p => [p.id, p.address]));
  const accountMap = new Map(bankAccounts.map(a => [a.id, a.name]));

  const handleAddAccount = async () => {
    setIsSubmitting(true);
    try {
      const result = await createBankAccountAction({
        name: newAccount.name,
        institution: newAccount.institution || null,
        account_type: newAccount.account_type,
        account_number_last4: newAccount.account_number_last4 || null,
        current_balance: newAccount.current_balance ? parseFloat(newAccount.current_balance) : null,
        is_default: bankAccounts.length === 0,
        notes: null,
      });

      if (result.success) {
        setIsAddAccountOpen(false);
        setNewAccount({
          name: '',
          institution: '',
          account_type: 'checking',
          account_number_last4: '',
          current_balance: '',
        });
        router.refresh();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAccount = async (id: string) => {
    if (confirm('Are you sure you want to delete this account?')) {
      await deleteBankAccountAction(id);
      router.refresh();
    }
  };

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'credit_card':
        return <CreditCard className="h-4 w-4" />;
      default:
        return <Landmark className="h-4 w-4" />;
    }
  };

  const formatAccountType = (type: string) => {
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

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

      {/* Bank Accounts Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Bank Accounts</h2>
          <Dialog open={isAddAccountOpen} onOpenChange={setIsAddAccountOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Account
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Bank Account</DialogTitle>
                <DialogDescription>
                  Add a new bank account to track transactions
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Account Name *</Label>
                  <Input
                    id="name"
                    value={newAccount.name}
                    onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                    placeholder="e.g., PNC Checking"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="institution">Institution</Label>
                  <Input
                    id="institution"
                    value={newAccount.institution}
                    onChange={(e) => setNewAccount({ ...newAccount, institution: e.target.value })}
                    placeholder="e.g., PNC Bank"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="account_type">Account Type</Label>
                    <Select
                      value={newAccount.account_type}
                      onValueChange={(value) => setNewAccount({ ...newAccount, account_type: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="checking">Checking</SelectItem>
                        <SelectItem value="savings">Savings</SelectItem>
                        <SelectItem value="credit_card">Credit Card</SelectItem>
                        <SelectItem value="investment">Investment</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last4">Last 4 Digits</Label>
                    <Input
                      id="last4"
                      value={newAccount.account_number_last4}
                      onChange={(e) => setNewAccount({ ...newAccount, account_number_last4: e.target.value })}
                      placeholder="1234"
                      maxLength={4}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="balance">Current Balance ($)</Label>
                  <Input
                    id="balance"
                    type="number"
                    step="0.01"
                    value={newAccount.current_balance}
                    onChange={(e) => setNewAccount({ ...newAccount, current_balance: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddAccountOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddAccount} disabled={!newAccount.name || isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Account
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {bankAccounts.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {bankAccounts.map((account) => (
              <Card key={account.id} className={account.is_default ? 'border-primary' : ''}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getAccountIcon(account.account_type)}
                      <CardTitle className="text-sm font-medium">{account.name}</CardTitle>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteAccount(account.id)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  {account.institution && (
                    <CardDescription>{account.institution}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${(account.current_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {formatAccountType(account.account_type)}
                    </Badge>
                    {account.account_number_last4 && (
                      <span className="text-xs text-muted-foreground">
                        ****{account.account_number_last4}
                      </span>
                    )}
                    {account.is_default && (
                      <Badge variant="outline" className="text-xs">Default</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8 text-center">
              <Landmark className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium">No bank accounts</h3>
              <p className="text-sm text-muted-foreground">
                Add a bank account to organize your transactions
              </p>
            </CardContent>
          </Card>
        )}
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
            <p className="text-xs text-muted-foreground">All time</p>
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
            <p className="text-xs text-muted-foreground">All time</p>
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
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transactions.length}</div>
            <p className="text-xs text-muted-foreground">Total count</p>
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
            <div className="flex gap-2 flex-wrap">
              {bankAccounts.length > 0 && (
                <Select value={accountFilter} onValueChange={setAccountFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Account" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Accounts</SelectItem>
                    {bankAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
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
                  <TableHead>Account</TableHead>
                  <TableHead>Property</TableHead>
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
                      {tx.bank_account_id ? (
                        <span className="text-sm">{accountMap.get(tx.bank_account_id) || '-'}</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {tx.property_id ? (
                        <Link
                          href={`/properties/${tx.property_id}`}
                          className="text-sm text-primary hover:underline"
                        >
                          {propertyMap.get(tx.property_id) || 'Unknown Property'}
                        </Link>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell
                      className={`text-right font-medium ${
                        tx.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : '-'}$
                      {Number(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
