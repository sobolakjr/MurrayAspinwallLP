'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  DollarSign,
  TrendingUp,
  Calculator,
  Percent,
  Home,
  PiggyBank,
  ArrowRight,
  Save,
  ArrowLeft,
  MapPin,
} from 'lucide-react';
import { calculateProforma, formatCurrency, formatPercent } from '@/lib/proforma-calculations';
import type { ProformaScenario, Prospect } from '@/types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
  BarChart,
  Bar,
} from 'recharts';

interface CalculatorClientProps {
  prospect: Prospect | null;
}

const defaultScenario: Omit<ProformaScenario, 'id' | 'created_at' | 'updated_at'> = {
  prospect_id: null,
  property_id: null,
  name: 'New Scenario',
  is_default: true,
  purchase_price: 250000,
  down_payment_pct: 20,
  interest_rate: 7.0,
  loan_term: 30,
  closing_costs: 5000,
  rehab_budget: 0,
  monthly_rent: 2000,
  vacancy_rate: 5,
  property_mgmt_pct: 0,
  insurance: 1500,
  taxes: 3000,
  maintenance_reserve_pct: 5,
  hoa: 0,
  utilities: 0,
  appreciation_rate: 3,
  rent_growth_rate: 2,
};

export function CalculatorClient({ prospect }: CalculatorClientProps) {
  const [scenario, setScenario] = useState(defaultScenario);
  const [projectionYears, setProjectionYears] = useState(10);

  // Pre-populate from prospect data
  useEffect(() => {
    if (prospect) {
      const apiData = prospect.api_data as any;

      // Get the most recent tax amount from api_data if available
      let annualTaxes = 3000; // default
      if (apiData?.propertyTaxes) {
        const years = Object.keys(apiData.propertyTaxes).sort((a, b) => Number(b) - Number(a));
        if (years.length > 0) {
          annualTaxes = apiData.propertyTaxes[years[0]]?.total || 3000;
        }
      }

      setScenario(prev => ({
        ...prev,
        prospect_id: prospect.id,
        name: prospect.address,
        purchase_price: Number(prospect.list_price) || prev.purchase_price,
        taxes: annualTaxes,
      }));
    }
  }, [prospect]);

  const results = useMemo(() => {
    return calculateProforma(scenario as ProformaScenario, projectionYears);
  }, [scenario, projectionYears]);

  const updateScenario = (field: keyof typeof scenario, value: number) => {
    setScenario((prev) => ({ ...prev, [field]: value }));
  };

  const chartData = results.yearlyProjections.slice(0, projectionYears).map((year) => ({
    year: `Year ${year.year}`,
    value: Math.round(year.propertyValue),
    equity: Math.round(year.equity),
    cashFlow: Math.round(year.cumulativeCashFlow),
  }));

  const cashFlowBreakdown = [
    { name: 'Gross Rent', value: results.grossMonthlyRent },
    { name: 'Vacancy', value: -results.annualVacancyLoss / 12 },
    { name: 'Expenses', value: -results.totalMonthlyExpenses },
    { name: 'Mortgage', value: -results.monthlyMortgagePayment },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {prospect && (
            <Button variant="ghost" size="icon" asChild>
              <Link href={`/prospects/${prospect.id}`}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
          )}
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Proforma Calculator</h1>
            {prospect ? (
              <p className="text-muted-foreground flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {prospect.address}, {prospect.city}, {prospect.state}
              </p>
            ) : (
              <p className="text-muted-foreground">
                Analyze investment returns with detailed financial projections
              </p>
            )}
          </div>
        </div>
        <Button>
          <Save className="mr-2 h-4 w-4" />
          Save Scenario
        </Button>
      </div>

      {/* Prospect Info Banner */}
      {prospect && (
        <Card className="bg-muted/50">
          <CardContent className="py-4">
            <div className="flex flex-wrap gap-6 text-sm">
              <div>
                <span className="text-muted-foreground">Property: </span>
                <span className="font-medium">{prospect.address}</span>
              </div>
              {prospect.bedrooms && (
                <div>
                  <span className="text-muted-foreground">Beds/Baths: </span>
                  <span className="font-medium">{prospect.bedrooms}bd / {prospect.bathrooms}ba</span>
                </div>
              )}
              {prospect.sqft && (
                <div>
                  <span className="text-muted-foreground">Sqft: </span>
                  <span className="font-medium">{prospect.sqft.toLocaleString()}</span>
                </div>
              )}
              {prospect.year_built && (
                <div>
                  <span className="text-muted-foreground">Built: </span>
                  <span className="font-medium">{prospect.year_built}</span>
                </div>
              )}
              <Badge variant="secondary">{prospect.property_type?.replace('_', ' ')}</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Input Form */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Purchase Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Purchase Price</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    value={scenario.purchase_price}
                    onChange={(e) => updateScenario('purchase_price', Number(e.target.value))}
                    className="pl-8"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Down Payment %</Label>
                  <Input
                    type="number"
                    value={scenario.down_payment_pct}
                    onChange={(e) => updateScenario('down_payment_pct', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Interest Rate %</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={scenario.interest_rate}
                    onChange={(e) => updateScenario('interest_rate', Number(e.target.value))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Loan Term (years)</Label>
                  <Input
                    type="number"
                    value={scenario.loan_term}
                    onChange={(e) => updateScenario('loan_term', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Closing Costs</Label>
                  <Input
                    type="number"
                    value={scenario.closing_costs}
                    onChange={(e) => updateScenario('closing_costs', Number(e.target.value))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Rehab Budget</Label>
                <Input
                  type="number"
                  value={scenario.rehab_budget}
                  onChange={(e) => updateScenario('rehab_budget', Number(e.target.value))}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Income & Expenses
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Monthly Rent</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    value={scenario.monthly_rent}
                    onChange={(e) => updateScenario('monthly_rent', Number(e.target.value))}
                    className="pl-8"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Vacancy Rate %</Label>
                  <Input
                    type="number"
                    value={scenario.vacancy_rate}
                    onChange={(e) => updateScenario('vacancy_rate', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Prop Mgmt %</Label>
                  <Input
                    type="number"
                    value={scenario.property_mgmt_pct}
                    onChange={(e) => updateScenario('property_mgmt_pct', Number(e.target.value))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Annual Insurance</Label>
                  <Input
                    type="number"
                    value={scenario.insurance}
                    onChange={(e) => updateScenario('insurance', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Annual Taxes</Label>
                  <Input
                    type="number"
                    value={scenario.taxes}
                    onChange={(e) => updateScenario('taxes', Number(e.target.value))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Maintenance %</Label>
                  <Input
                    type="number"
                    value={scenario.maintenance_reserve_pct}
                    onChange={(e) => updateScenario('maintenance_reserve_pct', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Monthly HOA</Label>
                  <Input
                    type="number"
                    value={scenario.hoa}
                    onChange={(e) => updateScenario('hoa', Number(e.target.value))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Growth Assumptions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Appreciation %</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={scenario.appreciation_rate}
                    onChange={(e) => updateScenario('appreciation_rate', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Rent Growth %</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={scenario.rent_growth_rate}
                    onChange={(e) => updateScenario('rent_growth_rate', Number(e.target.value))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        <div className="lg:col-span-2 space-y-4">
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className={results.monthlyCashFlow >= 0 ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Monthly Cash Flow</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${results.monthlyCashFlow >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  {formatCurrency(results.monthlyCashFlow)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Cap Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatPercent(results.capRate)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Cash-on-Cash</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatPercent(results.cashOnCashReturn)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">DSCR</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{results.dscr.toFixed(2)}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{projectionYears}-Year IRR</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatPercent(results.irr)}</div>
                <p className="text-xs text-muted-foreground">Internal Rate of Return</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Cash Required</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(results.totalCashInvested)}</div>
                <p className="text-xs text-muted-foreground">Down payment + closing + rehab</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs for detailed analysis */}
          <Card>
            <Tabs defaultValue="summary" className="p-6">
              <TabsList>
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
                <TabsTrigger value="projections">Projections</TabsTrigger>
              </TabsList>

              <TabsContent value="summary" className="space-y-4 pt-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="font-medium mb-2">Investment Summary</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Purchase Price</span>
                        <span>{formatCurrency(scenario.purchase_price)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Loan Amount</span>
                        <span>{formatCurrency(results.loanAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Down Payment</span>
                        <span>{formatCurrency(scenario.purchase_price * scenario.down_payment_pct / 100)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Closing Costs</span>
                        <span>{formatCurrency(scenario.closing_costs)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Rehab Budget</span>
                        <span>{formatCurrency(scenario.rehab_budget)}</span>
                      </div>
                      <Separator className="my-2" />
                      <div className="flex justify-between font-medium">
                        <span>Total Cash Required</span>
                        <span>{formatCurrency(results.totalCashInvested)}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Monthly Breakdown</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Gross Rent</span>
                        <span className="text-green-600">{formatCurrency(results.grossMonthlyRent)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Vacancy ({scenario.vacancy_rate}%)</span>
                        <span className="text-red-600">-{formatCurrency(results.annualVacancyLoss / 12)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Operating Expenses</span>
                        <span className="text-red-600">-{formatCurrency(results.totalMonthlyExpenses)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Mortgage Payment</span>
                        <span className="text-red-600">-{formatCurrency(results.monthlyMortgagePayment)}</span>
                      </div>
                      <Separator className="my-2" />
                      <div className="flex justify-between font-medium">
                        <span>Net Cash Flow</span>
                        <span className={results.monthlyCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {formatCurrency(results.monthlyCashFlow)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="cashflow" className="pt-4">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={cashFlowBreakdown}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Bar dataKey="value">
                        {cashFlowBreakdown.map((entry, index) => (
                          <Cell key={index} fill={entry.value >= 0 ? '#22c55e' : '#ef4444'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>

              <TabsContent value="projections" className="space-y-4 pt-4">
                <div className="flex items-center gap-4">
                  <Label>Projection Period:</Label>
                  <div className="flex gap-2">
                    {[5, 10, 15, 30].map((years) => (
                      <Button
                        key={years}
                        variant={projectionYears === years ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setProjectionYears(years)}
                      >
                        {years} Years
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#3b82f6"
                        name="Property Value"
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="equity"
                        stroke="#22c55e"
                        name="Equity"
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="cashFlow"
                        stroke="#f59e0b"
                        name="Cumulative Cash Flow"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  );
}
