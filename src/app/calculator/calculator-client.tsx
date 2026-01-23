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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DollarSign,
  TrendingUp,
  Home,
  Save,
  ArrowLeft,
  MapPin,
  Calendar,
  Building2,
  Palmtree,
} from 'lucide-react';
import {
  calculateProforma,
  calculateSTRProforma,
  formatCurrency,
  formatPercent,
  DEFAULT_SEASONALITY_WEIGHTS,
  MONTH_NAMES,
  type STRScenario,
} from '@/lib/proforma-calculations';
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

type RentalType = 'ltr' | 'str';

const defaultLTRScenario: Omit<ProformaScenario, 'id' | 'created_at' | 'updated_at'> = {
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

const defaultSTRScenario: STRScenario = {
  purchase_price: 250000,
  down_payment_pct: 20,
  interest_rate: 7.0,
  loan_term: 30,
  closing_costs: 5000,
  rehab_budget: 0,
  avg_daily_rate: 150,
  occupancy_rate: 65,
  seasonality: [...DEFAULT_SEASONALITY_WEIGHTS],
  seasonality_mode: 'weight',
  property_mgmt_pct: 20,
  listing_service_pct: 3,
  cleaning_cost_per_turnover: 100,
  turnovers_per_year: 75,
  capital_reserve_pct: 5,
  insurance: 2500,
  taxes: 3000,
  hoa: 0,
  utilities: 200,
  appreciation_rate: 3,
  adr_growth_rate: 2,
};

export function CalculatorClient({ prospect }: CalculatorClientProps) {
  const [rentalType, setRentalType] = useState<RentalType>('ltr');
  const [ltrScenario, setLtrScenario] = useState(defaultLTRScenario);
  const [strScenario, setStrScenario] = useState(defaultSTRScenario);
  const [projectionYears, setProjectionYears] = useState(10);
  const [seasonalityOpen, setSeasonalityOpen] = useState(false);

  // Pre-populate from prospect data
  useEffect(() => {
    if (prospect) {
      const apiData = prospect.api_data as any;

      let annualTaxes = 3000;
      if (apiData?.propertyTaxes) {
        const years = Object.keys(apiData.propertyTaxes).sort((a, b) => Number(b) - Number(a));
        if (years.length > 0) {
          annualTaxes = apiData.propertyTaxes[years[0]]?.total || 3000;
        }
      }

      const purchasePrice = apiData?.listingPrice
        ? Number(apiData.listingPrice)
        : Number(prospect.list_price) || 250000;

      setLtrScenario(prev => ({
        ...prev,
        prospect_id: prospect.id,
        name: prospect.address,
        purchase_price: purchasePrice,
        taxes: annualTaxes,
      }));

      setStrScenario(prev => ({
        ...prev,
        purchase_price: purchasePrice,
        taxes: annualTaxes,
      }));
    }
  }, [prospect]);

  const results = useMemo(() => {
    if (rentalType === 'ltr') {
      return calculateProforma(ltrScenario as ProformaScenario, projectionYears);
    } else {
      return calculateSTRProforma(strScenario, projectionYears);
    }
  }, [rentalType, ltrScenario, strScenario, projectionYears]);

  const updateLtrScenario = (field: keyof typeof ltrScenario, value: number) => {
    setLtrScenario((prev) => ({ ...prev, [field]: value }));
  };

  const updateStrScenario = (field: keyof STRScenario, value: number | number[] | string) => {
    setStrScenario((prev) => ({ ...prev, [field]: value }));
  };

  const updateSeasonality = (monthIndex: number, value: number) => {
    const newSeasonality = [...strScenario.seasonality];
    newSeasonality[monthIndex] = value;
    setStrScenario((prev) => ({ ...prev, seasonality: newSeasonality }));
  };

  const chartData = results.yearlyProjections.slice(0, projectionYears).map((year) => ({
    year: `Year ${year.year}`,
    value: Math.round(year.propertyValue),
    equity: Math.round(year.equity),
    cashFlow: Math.round(year.cumulativeCashFlow),
  }));

  const cashFlowBreakdown = rentalType === 'ltr'
    ? [
        { name: 'Gross Rent', value: results.grossMonthlyRent },
        { name: 'Vacancy', value: -results.annualVacancyLoss / 12 },
        { name: 'Expenses', value: -results.totalMonthlyExpenses },
        { name: 'Mortgage', value: -results.monthlyMortgagePayment },
      ]
    : [
        { name: 'Revenue', value: results.grossMonthlyRent },
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

      {/* Rental Type Toggle */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-center gap-4">
            <Button
              variant={rentalType === 'ltr' ? 'default' : 'outline'}
              onClick={() => setRentalType('ltr')}
              className="w-40"
            >
              <Building2 className="mr-2 h-4 w-4" />
              Long-Term Rental
            </Button>
            <Button
              variant={rentalType === 'str' ? 'default' : 'outline'}
              onClick={() => setRentalType('str')}
              className="w-40"
            >
              <Palmtree className="mr-2 h-4 w-4" />
              Short-Term Rental
            </Button>
          </div>
        </CardContent>
      </Card>

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
              <Badge variant="secondary">{prospect.property_type?.replace('_', ' ')}</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Input Form */}
        <div className="lg:col-span-1 space-y-4">
          {/* Purchase Details - Same for both */}
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
                    value={rentalType === 'ltr' ? ltrScenario.purchase_price : strScenario.purchase_price}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (rentalType === 'ltr') {
                        updateLtrScenario('purchase_price', val);
                      } else {
                        updateStrScenario('purchase_price', val);
                      }
                    }}
                    className="pl-8"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Down Payment %</Label>
                  <Input
                    type="number"
                    value={rentalType === 'ltr' ? ltrScenario.down_payment_pct : strScenario.down_payment_pct}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (rentalType === 'ltr') {
                        updateLtrScenario('down_payment_pct', val);
                      } else {
                        updateStrScenario('down_payment_pct', val);
                      }
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Interest Rate %</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={rentalType === 'ltr' ? ltrScenario.interest_rate : strScenario.interest_rate}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (rentalType === 'ltr') {
                        updateLtrScenario('interest_rate', val);
                      } else {
                        updateStrScenario('interest_rate', val);
                      }
                    }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Loan Term (years)</Label>
                  <Input
                    type="number"
                    value={rentalType === 'ltr' ? ltrScenario.loan_term : strScenario.loan_term}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (rentalType === 'ltr') {
                        updateLtrScenario('loan_term', val);
                      } else {
                        updateStrScenario('loan_term', val);
                      }
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Closing Costs</Label>
                  <Input
                    type="number"
                    value={rentalType === 'ltr' ? ltrScenario.closing_costs : strScenario.closing_costs}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (rentalType === 'ltr') {
                        updateLtrScenario('closing_costs', val);
                      } else {
                        updateStrScenario('closing_costs', val);
                      }
                    }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Rehab Budget</Label>
                <Input
                  type="number"
                  value={rentalType === 'ltr' ? ltrScenario.rehab_budget : strScenario.rehab_budget}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (rentalType === 'ltr') {
                      updateLtrScenario('rehab_budget', val);
                    } else {
                      updateStrScenario('rehab_budget', val);
                    }
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* LTR Income & Expenses */}
          {rentalType === 'ltr' && (
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
                      value={ltrScenario.monthly_rent}
                      onChange={(e) => updateLtrScenario('monthly_rent', Number(e.target.value))}
                      className="pl-8"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Vacancy Rate %</Label>
                    <Input
                      type="number"
                      value={ltrScenario.vacancy_rate}
                      onChange={(e) => updateLtrScenario('vacancy_rate', Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Prop Mgmt %</Label>
                    <Input
                      type="number"
                      value={ltrScenario.property_mgmt_pct}
                      onChange={(e) => updateLtrScenario('property_mgmt_pct', Number(e.target.value))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Annual Insurance</Label>
                    <Input
                      type="number"
                      value={ltrScenario.insurance}
                      onChange={(e) => updateLtrScenario('insurance', Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Annual Taxes</Label>
                    <Input
                      type="number"
                      value={ltrScenario.taxes}
                      onChange={(e) => updateLtrScenario('taxes', Number(e.target.value))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Maintenance %</Label>
                    <Input
                      type="number"
                      value={ltrScenario.maintenance_reserve_pct}
                      onChange={(e) => updateLtrScenario('maintenance_reserve_pct', Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Monthly HOA</Label>
                    <Input
                      type="number"
                      value={ltrScenario.hoa}
                      onChange={(e) => updateLtrScenario('hoa', Number(e.target.value))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* STR Income */}
          {rentalType === 'str' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  STR Income
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Average Daily Rate (ADR)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      value={strScenario.avg_daily_rate}
                      onChange={(e) => updateStrScenario('avg_daily_rate', Number(e.target.value))}
                      className="pl-8"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Occupancy Rate %</Label>
                  <Input
                    type="number"
                    value={strScenario.occupancy_rate}
                    onChange={(e) => updateStrScenario('occupancy_rate', Number(e.target.value))}
                  />
                </div>

                {/* Seasonality Button */}
                <Dialog open={seasonalityOpen} onOpenChange={setSeasonalityOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full">
                      <Calendar className="mr-2 h-4 w-4" />
                      Seasonality Table
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Seasonality Adjustments</DialogTitle>
                      <DialogDescription>
                        Adjust daily rates or weights by month. Use weights (1.0 = average) or enter specific dollar amounts.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="flex gap-4 mb-4">
                        <Button
                          variant={strScenario.seasonality_mode === 'weight' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => updateStrScenario('seasonality_mode', 'weight')}
                        >
                          Use Weights
                        </Button>
                        <Button
                          variant={strScenario.seasonality_mode === 'rate' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => updateStrScenario('seasonality_mode', 'rate')}
                        >
                          Use $ Rates
                        </Button>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        {MONTH_NAMES.map((month, index) => (
                          <div key={month} className="space-y-1">
                            <Label className="text-xs">{month}</Label>
                            <div className="relative">
                              {strScenario.seasonality_mode === 'rate' && (
                                <DollarSign className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
                              )}
                              <Input
                                type="number"
                                step={strScenario.seasonality_mode === 'weight' ? '0.1' : '1'}
                                value={strScenario.seasonality[index]}
                                onChange={(e) => updateSeasonality(index, Number(e.target.value))}
                                className={strScenario.seasonality_mode === 'rate' ? 'pl-7' : ''}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground pt-4 border-t">
                        <span>
                          {strScenario.seasonality_mode === 'weight'
                            ? `Weighted Avg ADR: $${Math.round(strScenario.avg_daily_rate * (strScenario.seasonality.reduce((a, b) => a + b, 0) / 12))}`
                            : `Avg Rate: $${Math.round(strScenario.seasonality.reduce((a, b) => a + b, 0) / 12)}`}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (strScenario.seasonality_mode === 'weight') {
                              updateStrScenario('seasonality', [...DEFAULT_SEASONALITY_WEIGHTS]);
                            } else {
                              updateStrScenario('seasonality', Array(12).fill(strScenario.avg_daily_rate));
                            }
                          }}
                        >
                          Reset to Default
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          )}

          {/* STR Expenses */}
          {rentalType === 'str' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  STR Expenses
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Prop Mgmt %</Label>
                    <Input
                      type="number"
                      value={strScenario.property_mgmt_pct}
                      onChange={(e) => updateStrScenario('property_mgmt_pct', Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Listing Service %</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={strScenario.listing_service_pct}
                      onChange={(e) => updateStrScenario('listing_service_pct', Number(e.target.value))}
                    />
                    <p className="text-xs text-muted-foreground">Airbnb, VRBO fees</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cleaning $/Turnover</Label>
                    <Input
                      type="number"
                      value={strScenario.cleaning_cost_per_turnover}
                      onChange={(e) => updateStrScenario('cleaning_cost_per_turnover', Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Turnovers/Year</Label>
                    <Input
                      type="number"
                      value={strScenario.turnovers_per_year}
                      onChange={(e) => updateStrScenario('turnovers_per_year', Number(e.target.value))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Capital Reserve %</Label>
                  <Input
                    type="number"
                    value={strScenario.capital_reserve_pct}
                    onChange={(e) => updateStrScenario('capital_reserve_pct', Number(e.target.value))}
                  />
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Annual Insurance</Label>
                    <Input
                      type="number"
                      value={strScenario.insurance}
                      onChange={(e) => updateStrScenario('insurance', Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Annual Taxes</Label>
                    <Input
                      type="number"
                      value={strScenario.taxes}
                      onChange={(e) => updateStrScenario('taxes', Number(e.target.value))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Monthly HOA</Label>
                    <Input
                      type="number"
                      value={strScenario.hoa}
                      onChange={(e) => updateStrScenario('hoa', Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Monthly Utilities</Label>
                    <Input
                      type="number"
                      value={strScenario.utilities}
                      onChange={(e) => updateStrScenario('utilities', Number(e.target.value))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Growth Assumptions */}
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
                    value={rentalType === 'ltr' ? ltrScenario.appreciation_rate : strScenario.appreciation_rate}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (rentalType === 'ltr') {
                        updateLtrScenario('appreciation_rate', val);
                      } else {
                        updateStrScenario('appreciation_rate', val);
                      }
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{rentalType === 'ltr' ? 'Rent Growth %' : 'ADR Growth %'}</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={rentalType === 'ltr' ? ltrScenario.rent_growth_rate : strScenario.adr_growth_rate}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (rentalType === 'ltr') {
                        updateLtrScenario('rent_growth_rate', val);
                      } else {
                        updateStrScenario('adr_growth_rate', val);
                      }
                    }}
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
                        <span>{formatCurrency(rentalType === 'ltr' ? ltrScenario.purchase_price : strScenario.purchase_price)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Loan Amount</span>
                        <span>{formatCurrency(results.loanAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Down Payment</span>
                        <span>{formatCurrency(
                          rentalType === 'ltr'
                            ? ltrScenario.purchase_price * ltrScenario.down_payment_pct / 100
                            : strScenario.purchase_price * strScenario.down_payment_pct / 100
                        )}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Closing Costs</span>
                        <span>{formatCurrency(rentalType === 'ltr' ? ltrScenario.closing_costs : strScenario.closing_costs)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Rehab Budget</span>
                        <span>{formatCurrency(rentalType === 'ltr' ? ltrScenario.rehab_budget : strScenario.rehab_budget)}</span>
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
                        <span className="text-muted-foreground">
                          {rentalType === 'ltr' ? 'Gross Rent' : 'Gross Revenue'}
                        </span>
                        <span className="text-green-600">{formatCurrency(results.grossMonthlyRent)}</span>
                      </div>
                      {rentalType === 'ltr' && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Vacancy ({ltrScenario.vacancy_rate}%)</span>
                          <span className="text-red-600">-{formatCurrency(results.annualVacancyLoss / 12)}</span>
                        </div>
                      )}
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
