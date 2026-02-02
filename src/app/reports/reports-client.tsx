'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Download, FileText, PieChart as PieChartIcon, TrendingUp, Building2 } from 'lucide-react';
import type { Property, Transaction } from '@/types';

interface ReportsClientProps {
  properties: Property[];
  transactions: Transaction[];
}

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Tax categories mapping for Schedule E
const TAX_CATEGORIES: Record<string, string[]> = {
  'Advertising': ['Advertising'],
  'Auto and Travel': ['Travel'],
  'Cleaning and Maintenance': ['Maintenance', 'Cleaning', 'Landscaping', 'Pest Control'],
  'Insurance': ['Insurance'],
  'Legal and Professional': ['Legal', 'Tax Prep'],
  'Management Fees': ['Property Management'],
  'Mortgage Interest': ['Mortgage'],
  'Repairs': ['Repairs'],
  'Supplies': ['Supplies'],
  'Taxes': ['Property Tax'],
  'Utilities': ['Utilities', 'HOA'],
  'Other': ['Other Expense'],
};

export function ReportsClient({ properties, transactions }: ReportsClientProps) {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [selectedProperty, setSelectedProperty] = useState<string>('all');

  // Filter transactions by year and property
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const txYear = new Date(tx.date).getFullYear().toString();
      const matchesYear = txYear === selectedYear;
      const matchesProperty = selectedProperty === 'all' || tx.property_id === selectedProperty;
      return matchesYear && matchesProperty;
    });
  }, [transactions, selectedYear, selectedProperty]);

  // Calculate income statement data
  const incomeStatement = useMemo(() => {
    const income = filteredTransactions
      .filter((tx) => tx.type === 'income')
      .reduce((sum, tx) => sum + Number(tx.amount), 0);

    const expensesByCategory: Record<string, number> = {};
    filteredTransactions
      .filter((tx) => tx.type === 'expense')
      .forEach((tx) => {
        expensesByCategory[tx.category] = (expensesByCategory[tx.category] || 0) + Number(tx.amount);
      });

    const totalExpenses = Object.values(expensesByCategory).reduce((sum, val) => sum + val, 0);
    const netIncome = income - totalExpenses;

    // Monthly breakdown
    const monthlyData = MONTHS.map((month, index) => {
      const monthTransactions = filteredTransactions.filter((tx) => {
        const txMonth = new Date(tx.date).getMonth();
        return txMonth === index;
      });

      const monthIncome = monthTransactions
        .filter((tx) => tx.type === 'income')
        .reduce((sum, tx) => sum + Number(tx.amount), 0);

      const monthExpenses = monthTransactions
        .filter((tx) => tx.type === 'expense')
        .reduce((sum, tx) => sum + Number(tx.amount), 0);

      return {
        month,
        income: monthIncome,
        expenses: monthExpenses,
        net: monthIncome - monthExpenses,
      };
    });

    return {
      income,
      expensesByCategory,
      totalExpenses,
      netIncome,
      monthlyData,
    };
  }, [filteredTransactions]);

  // Calculate tax summary (Schedule E style)
  const taxSummary = useMemo(() => {
    const taxData: Record<string, number> = {};

    Object.entries(TAX_CATEGORIES).forEach(([taxCategory, appCategories]) => {
      const amount = filteredTransactions
        .filter((tx) => tx.type === 'expense' && appCategories.includes(tx.category))
        .reduce((sum, tx) => sum + Number(tx.amount), 0);
      if (amount > 0) {
        taxData[taxCategory] = amount;
      }
    });

    const totalDeductions = Object.values(taxData).reduce((sum, val) => sum + val, 0);
    const rentalIncome = filteredTransactions
      .filter((tx) => tx.type === 'income')
      .reduce((sum, tx) => sum + Number(tx.amount), 0);

    return {
      rentalIncome,
      deductions: taxData,
      totalDeductions,
      netRentalIncome: rentalIncome - totalDeductions,
    };
  }, [filteredTransactions]);

  // Property comparison data
  const propertyComparison = useMemo(() => {
    return properties
      .filter((p) => p.status !== 'sold')
      .map((property) => {
        const propertyTransactions = transactions.filter(
          (tx) => tx.property_id === property.id && new Date(tx.date).getFullYear().toString() === selectedYear
        );

        const income = propertyTransactions
          .filter((tx) => tx.type === 'income')
          .reduce((sum, tx) => sum + Number(tx.amount), 0);

        const expenses = propertyTransactions
          .filter((tx) => tx.type === 'expense')
          .reduce((sum, tx) => sum + Number(tx.amount), 0);

        const cashFlow = income - expenses;
        const value = Number(property.current_value) || 0;
        const equity = value - (Number(property.mortgage_balance) || 0);
        const roi = value > 0 ? ((cashFlow / equity) * 100) : 0;

        return {
          id: property.id,
          address: property.address,
          city: property.city,
          income,
          expenses,
          cashFlow,
          value,
          equity,
          roi,
        };
      });
  }, [properties, transactions, selectedYear]);

  // Export to CSV
  const exportToCSV = (data: Record<string, unknown>[], filename: string) => {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map((row) =>
        headers.map((header) => {
          const value = row[header];
          if (typeof value === 'number') return value.toFixed(2);
          return `"${value}"`;
        }).join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}-${selectedYear}.csv`;
    link.click();
  };

  // Get available years from transactions
  const availableYears = useMemo(() => {
    const years = new Set(transactions.map((tx) => new Date(tx.date).getFullYear()));
    return Array.from(years).sort((a, b) => b - a);
  }, [transactions]);

  // Pie chart data for expenses
  const expensePieData = Object.entries(incomeStatement.expensesByCategory)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            Financial reports and analysis
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {availableYears.length > 0 ? (
                availableYears.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value={currentYear.toString()}>{currentYear}</SelectItem>
              )}
            </SelectContent>
          </Select>
          <Select value={selectedProperty} onValueChange={setSelectedProperty}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Property" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Properties</SelectItem>
              {properties.filter((p) => p.status !== 'sold').map((property) => (
                <SelectItem key={property.id} value={property.id}>
                  {property.address}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${incomeStatement.income.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ${incomeStatement.totalExpenses.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Net Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${incomeStatement.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${incomeStatement.netIncome.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Properties</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {properties.filter((p) => p.status !== 'sold').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Tabs */}
      <Tabs defaultValue="income-statement" className="space-y-4">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="income-statement" className="gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Income Statement</span>
            <span className="sm:hidden">P&L</span>
          </TabsTrigger>
          <TabsTrigger value="tax-summary" className="gap-2">
            <PieChartIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Tax Summary</span>
            <span className="sm:hidden">Tax</span>
          </TabsTrigger>
          <TabsTrigger value="property-comparison" className="gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Property Comparison</span>
            <span className="sm:hidden">Compare</span>
          </TabsTrigger>
        </TabsList>

        {/* Income Statement Tab */}
        <TabsContent value="income-statement" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Income Statement</CardTitle>
                <CardDescription>Profit & Loss for {selectedYear}</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportToCSV(
                  incomeStatement.monthlyData.map((m) => ({
                    Month: m.month,
                    Income: m.income,
                    Expenses: m.expenses,
                    'Net Income': m.net,
                  })),
                  'income-statement'
                )}
              >
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Monthly Chart */}
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={incomeStatement.monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                    <Legend />
                    <Bar dataKey="income" name="Income" fill="#22c55e" />
                    <Bar dataKey="expenses" name="Expenses" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Expense Breakdown */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-4">Expense Breakdown</h4>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={expensePieData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                        >
                          {expensePieData.map((_, index) => (
                            <Cell key={index} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-4">Category Details</h4>
                  <div className="space-y-2">
                    {Object.entries(incomeStatement.expensesByCategory)
                      .sort(([, a], [, b]) => b - a)
                      .map(([category, amount], index) => (
                        <div key={category} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span className="text-sm">{category}</span>
                          </div>
                          <span className="text-sm font-medium">${amount.toLocaleString()}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tax Summary Tab */}
        <TabsContent value="tax-summary" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Tax Summary (Schedule E)</CardTitle>
                <CardDescription>Tax-ready expense breakdown for {selectedYear}</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportToCSV(
                  [
                    { Category: 'Rental Income', Amount: taxSummary.rentalIncome },
                    ...Object.entries(taxSummary.deductions).map(([cat, amt]) => ({
                      Category: cat,
                      Amount: -amt,
                    })),
                    { Category: 'Net Rental Income', Amount: taxSummary.netRentalIncome },
                  ],
                  'tax-summary'
                )}
              >
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="bg-green-50">
                    <TableCell className="font-medium">Rental Income</TableCell>
                    <TableCell className="text-right font-medium text-green-600">
                      ${taxSummary.rentalIncome.toLocaleString()}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={2} className="font-medium bg-muted/50">
                      Deductions
                    </TableCell>
                  </TableRow>
                  {Object.entries(taxSummary.deductions).map(([category, amount]) => (
                    <TableRow key={category}>
                      <TableCell className="pl-6">{category}</TableCell>
                      <TableCell className="text-right text-red-600">
                        (${amount.toLocaleString()})
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="border-t-2">
                    <TableCell className="font-medium">Total Deductions</TableCell>
                    <TableCell className="text-right font-medium text-red-600">
                      (${taxSummary.totalDeductions.toLocaleString()})
                    </TableCell>
                  </TableRow>
                  <TableRow className="bg-blue-50">
                    <TableCell className="font-bold">Net Rental Income</TableCell>
                    <TableCell className={`text-right font-bold ${taxSummary.netRentalIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${taxSummary.netRentalIncome.toLocaleString()}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Property Comparison Tab */}
        <TabsContent value="property-comparison" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Property Comparison</CardTitle>
                <CardDescription>Side-by-side performance for {selectedYear}</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportToCSV(
                  propertyComparison.map((p) => ({
                    Property: `${p.address}, ${p.city}`,
                    Income: p.income,
                    Expenses: p.expenses,
                    'Cash Flow': p.cashFlow,
                    Value: p.value,
                    Equity: p.equity,
                    'ROI %': p.roi.toFixed(1),
                  })),
                  'property-comparison'
                )}
              >
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Comparison Chart */}
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={propertyComparison} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                    <YAxis type="category" dataKey="address" width={120} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                    <Legend />
                    <Bar dataKey="income" name="Income" fill="#22c55e" />
                    <Bar dataKey="expenses" name="Expenses" fill="#ef4444" />
                    <Bar dataKey="cashFlow" name="Cash Flow" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Property Table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Property</TableHead>
                    <TableHead className="text-right">Income</TableHead>
                    <TableHead className="text-right hidden sm:table-cell">Expenses</TableHead>
                    <TableHead className="text-right">Cash Flow</TableHead>
                    <TableHead className="text-right hidden md:table-cell">Value</TableHead>
                    <TableHead className="text-right hidden md:table-cell">Equity</TableHead>
                    <TableHead className="text-right">ROI</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {propertyComparison.map((property) => (
                    <TableRow key={property.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{property.address}</div>
                          <div className="text-sm text-muted-foreground">{property.city}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        ${property.income.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-red-600 hidden sm:table-cell">
                        ${property.expenses.toLocaleString()}
                      </TableCell>
                      <TableCell className={`text-right font-medium ${property.cashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${property.cashFlow.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right hidden md:table-cell">
                        ${property.value.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right hidden md:table-cell">
                        ${property.equity.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={property.roi >= 0 ? 'default' : 'destructive'}>
                          {property.roi.toFixed(1)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
