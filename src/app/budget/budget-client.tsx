'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  PieChart,
  TrendingUp,
  TrendingDown,
  Plus,
  ChevronDown,
  ChevronRight,
  Building2,
  Loader2,
  Pencil,
  Trash2,
  Check,
  X,
} from 'lucide-react';
import type { Property, Transaction } from '@/types';
import { BUDGET_CATEGORIES, EXPENSE_CATEGORIES } from '@/types';
import { formatCurrency } from '@/lib/utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts';

interface BudgetClientProps {
  properties: Property[];
  transactions: Transaction[];
}

interface BudgetItem {
  category: string;
  annual: number;
  monthly: number[];
}

const currentYear = new Date().getFullYear();
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function BudgetClient({ properties, transactions }: BudgetClientProps) {
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedProperty, setSelectedProperty] = useState<string>('all');
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newBudgetCategory, setNewBudgetCategory] = useState('');
  const [newBudgetAmount, setNewBudgetAmount] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');

  // Filter transactions by year and property
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const txYear = new Date(t.date).getFullYear();
      const matchesYear = txYear === selectedYear;
      const matchesProperty = selectedProperty === 'all' || t.property_id === selectedProperty;
      return matchesYear && matchesProperty && t.type === 'expense';
    });
  }, [transactions, selectedYear, selectedProperty]);

  // Calculate actual spending by category
  const actualByCategory = useMemo(() => {
    const result: Record<string, { total: number; byMonth: number[] }> = {};

    filteredTransactions.forEach(t => {
      if (!result[t.category]) {
        result[t.category] = { total: 0, byMonth: Array(12).fill(0) };
      }
      const month = new Date(t.date).getMonth();
      result[t.category].total += Number(t.amount);
      result[t.category].byMonth[month] += Number(t.amount);
    });

    return result;
  }, [filteredTransactions]);

  // Combine budget and actual for comparison
  const comparisonData = useMemo(() => {
    const categories = new Set([
      ...budgetItems.map(b => b.category),
      ...Object.keys(actualByCategory),
    ]);

    return Array.from(categories).map(category => {
      const budget = budgetItems.find(b => b.category === category);
      const actual = actualByCategory[category];
      const budgetAmount = budget?.annual || 0;
      const actualAmount = actual?.total || 0;
      const variance = budgetAmount - actualAmount;
      const variancePercent = budgetAmount > 0 ? (variance / budgetAmount) * 100 : 0;

      return {
        category,
        budget: budgetAmount,
        actual: actualAmount,
        variance,
        variancePercent,
        monthlyBudget: budget?.monthly || Array(12).fill(budgetAmount / 12),
        monthlyActual: actual?.byMonth || Array(12).fill(0),
      };
    }).sort((a, b) => b.actual - a.actual);
  }, [budgetItems, actualByCategory]);

  const totalBudget = comparisonData.reduce((sum, item) => sum + item.budget, 0);
  const totalActual = comparisonData.reduce((sum, item) => sum + item.actual, 0);
  const totalVariance = totalBudget - totalActual;

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const handleAddBudget = () => {
    if (!newBudgetCategory || !newBudgetAmount) return;

    const amount = parseFloat(newBudgetAmount);
    const existing = budgetItems.findIndex(b => b.category === newBudgetCategory);

    if (existing >= 0) {
      const updated = [...budgetItems];
      updated[existing] = {
        ...updated[existing],
        annual: amount,
        monthly: Array(12).fill(amount / 12),
      };
      setBudgetItems(updated);
    } else {
      setBudgetItems([
        ...budgetItems,
        {
          category: newBudgetCategory,
          annual: amount,
          monthly: Array(12).fill(amount / 12),
        },
      ]);
    }

    setNewBudgetCategory('');
    setNewBudgetAmount('');
    setIsAddDialogOpen(false);
  };

  const handleStartEdit = (category: string, currentAmount: number) => {
    setEditingCategory(category);
    setEditAmount(currentAmount.toString());
  };

  const handleSaveEdit = (category: string) => {
    const amount = parseFloat(editAmount);
    if (isNaN(amount) || amount < 0) {
      setEditingCategory(null);
      return;
    }

    const existingIdx = budgetItems.findIndex(b => b.category === category);
    if (existingIdx >= 0) {
      const updated = [...budgetItems];
      updated[existingIdx] = {
        ...updated[existingIdx],
        annual: amount,
        monthly: Array(12).fill(amount / 12),
      };
      setBudgetItems(updated);
    } else {
      // Create new budget item for this category
      setBudgetItems([
        ...budgetItems,
        {
          category,
          annual: amount,
          monthly: Array(12).fill(amount / 12),
        },
      ]);
    }

    setEditingCategory(null);
    setEditAmount('');
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setEditAmount('');
  };

  const handleDeleteBudget = (category: string) => {
    setBudgetItems(budgetItems.filter(b => b.category !== category));
  };

  const chartData = comparisonData.slice(0, 10).map(item => ({
    name: item.category,
    Budget: item.budget,
    Actual: item.actual,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Budget vs Actual</h1>
          <p className="text-muted-foreground">
            Track spending against your budget by category
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[currentYear - 1, currentYear, currentYear + 1].map(year => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedProperty} onValueChange={setSelectedProperty}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select property" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Properties</SelectItem>
              {properties.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.address}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Budget
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Budget Item</DialogTitle>
                <DialogDescription>
                  Set an annual budget for a category
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={newBudgetCategory} onValueChange={setNewBudgetCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPENSE_CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Annual Budget Amount</Label>
                  <Input
                    type="number"
                    value={newBudgetAmount}
                    onChange={(e) => setNewBudgetAmount(e.target.value)}
                    placeholder="e.g., 5000"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddBudget} disabled={!newBudgetCategory || !newBudgetAmount}>
                  Add Budget
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalBudget)}</div>
            <p className="text-xs text-muted-foreground">
              {selectedYear} annual budget
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actual Spending</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalActual)}</div>
            <p className="text-xs text-muted-foreground">
              Year to date expenses
            </p>
          </CardContent>
        </Card>
        <Card className={totalVariance >= 0 ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Variance</CardTitle>
            {totalVariance >= 0 ? (
              <TrendingDown className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingUp className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalVariance >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              {totalVariance >= 0 ? '' : '-'}{formatCurrency(Math.abs(totalVariance))}
            </div>
            <p className="text-xs text-muted-foreground">
              {totalVariance >= 0 ? 'Under budget' : 'Over budget'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Budget vs Actual by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} />
                  <YAxis dataKey="name" type="category" width={120} />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                  <Bar dataKey="Budget" fill="#94a3b8" />
                  <Bar dataKey="Actual" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle>Category Breakdown</CardTitle>
          <CardDescription>Click a category to see monthly details</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Category</TableHead>
                <TableHead className="text-right">Budget</TableHead>
                <TableHead className="text-right">Actual</TableHead>
                <TableHead className="text-right">Variance</TableHead>
                <TableHead className="text-right">% of Budget</TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comparisonData.map((item) => (
                <>
                  <TableRow
                    key={item.category}
                    className="hover:bg-muted/50"
                  >
                    <TableCell className="font-medium">
                      <div
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={() => toggleCategory(item.category)}
                      >
                        {expandedCategories.has(item.category) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        {item.category}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {editingCategory === item.category ? (
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-muted-foreground">$</span>
                          <Input
                            type="number"
                            value={editAmount}
                            onChange={(e) => setEditAmount(e.target.value)}
                            className="w-24 h-8 text-right"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEdit(item.category);
                              if (e.key === 'Escape') handleCancelEdit();
                            }}
                          />
                        </div>
                      ) : (
                        formatCurrency(item.budget)
                      )}
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(item.actual)}</TableCell>
                    <TableCell className={`text-right ${item.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {item.variance >= 0 ? '' : '-'}{formatCurrency(Math.abs(item.variance))}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.budget > 0 ? (
                        <Badge variant={item.actual <= item.budget ? 'default' : 'destructive'}>
                          {((item.actual / item.budget) * 100).toFixed(0)}%
                        </Badge>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {editingCategory === item.category ? (
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleSaveEdit(item.category)}
                          >
                            <Check className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={handleCancelEdit}
                          >
                            <X className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleStartEdit(item.category, item.budget)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {item.budget > 0 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleDeleteBudget(item.category)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                  {expandedCategories.has(item.category) && (
                    <TableRow key={`${item.category}-details`}>
                      <TableCell colSpan={6} className="bg-muted/30 p-4">
                        <div className="grid grid-cols-12 gap-2 text-xs">
                          {months.map((month, idx) => (
                            <div key={month} className="text-center">
                              <div className="font-medium text-muted-foreground">{month}</div>
                              <div className="mt-1">{formatCurrency(item.monthlyActual[idx])}</div>
                              {item.budget > 0 && (
                                <div className="text-muted-foreground">
                                  / {formatCurrency(item.monthlyBudget[idx])}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))}
              <TableRow className="font-bold bg-muted/50">
                <TableCell>Total</TableCell>
                <TableCell className="text-right">{formatCurrency(totalBudget)}</TableCell>
                <TableCell className="text-right">{formatCurrency(totalActual)}</TableCell>
                <TableCell className={`text-right ${totalVariance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {totalVariance >= 0 ? '' : '-'}{formatCurrency(Math.abs(totalVariance))}
                </TableCell>
                <TableCell className="text-right">
                  {totalBudget > 0 && (
                    <Badge variant={totalActual <= totalBudget ? 'default' : 'destructive'}>
                      {((totalActual / totalBudget) * 100).toFixed(0)}%
                    </Badge>
                  )}
                </TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
