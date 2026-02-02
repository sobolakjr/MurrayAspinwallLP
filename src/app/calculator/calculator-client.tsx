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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { saveScenarioAction } from './actions';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  FolderOpen,
  Trash2,
  RefreshCw,
  Landmark,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { deleteScenarioAction } from './actions';
import type { SavedScenario } from '@/lib/database';
import {
  calculateProforma,
  calculateSTRProforma,
  formatCurrency,
  formatPercent,
  DEFAULT_SEASONALITY_WEIGHTS,
  MONTH_NAMES,
  type STRScenario,
} from '@/lib/proforma-calculations';
import { formatCurrencyCompact } from '@/lib/utils';
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
  prospects: Prospect[];
  initialProspect: Prospect | null;
  savedScenarios?: SavedScenario[];
  initialScenarioId?: string;
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

export function CalculatorClient({ prospects, initialProspect, savedScenarios = [], initialScenarioId }: CalculatorClientProps) {
  const [rentalType, setRentalType] = useState<RentalType>('ltr');
  const [ltrScenario, setLtrScenario] = useState(defaultLTRScenario);
  const [strScenario, setStrScenario] = useState(defaultSTRScenario);
  const [projectionYears, setProjectionYears] = useState(10);
  const [seasonalityOpen, setSeasonalityOpen] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [scenarioName, setScenarioName] = useState('');
  const [scenarioId, setScenarioId] = useState<string | null>(initialScenarioId || null);
  const [isSaving, setIsSaving] = useState(false);
  const [scenarios, setScenarios] = useState<SavedScenario[]>(savedScenarios);
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(initialProspect);
  const [financingExpanded, setFinancingExpanded] = useState(false);

  // Refinance state
  const [refinanceEnabled, setRefinanceEnabled] = useState(false);
  const [refinanceYear, setRefinanceYear] = useState(5);
  const [refinanceRate, setRefinanceRate] = useState(6.0);
  const [refinanceTerm, setRefinanceTerm] = useState(30);
  const [refinanceCashOut, setRefinanceCashOut] = useState(0);
  const [refinanceClosingCosts, setRefinanceClosingCosts] = useState(3000);

  // HELOC state
  const [helocEnabled, setHelocEnabled] = useState(false);
  const [helocYear, setHelocYear] = useState(3);
  const [helocAmount, setHelocAmount] = useState(50000);
  const [helocRate, setHelocRate] = useState(8.5);
  const [helocTerm, setHelocTerm] = useState(10);
  const [helocDrawPeriod, setHelocDrawPeriod] = useState(5);

  // Helper to get display price from prospect
  const getProspectPrice = (p: Prospect): number => {
    const apiData = p.api_data as Record<string, unknown> | null;
    const listingPrice = apiData?.listingPrice as number | null;
    return listingPrice || Number(p.list_price) || 250000;
  };

  // Handle prospect selection
  const handleProspectChange = (prospectId: string) => {
    if (prospectId === 'none') {
      setSelectedProspect(null);
      return;
    }
    const p = prospects.find((pr) => pr.id === prospectId);
    if (p) {
      setSelectedProspect(p);
      const purchasePrice = getProspectPrice(p);

      // Get taxes from api_data if available
      const apiData = p.api_data as Record<string, unknown> | null;
      let annualTaxes = 3000;
      if (apiData?.propertyTaxes) {
        const taxData = apiData.propertyTaxes as Record<string, { total?: number }>;
        const years = Object.keys(taxData).sort((a, b) => Number(b) - Number(a));
        if (years.length > 0) {
          annualTaxes = taxData[years[0]]?.total || 3000;
        }
      }

      setLtrScenario((prev) => ({
        ...prev,
        prospect_id: p.id,
        name: p.address,
        purchase_price: purchasePrice,
        taxes: annualTaxes,
      }));
      setStrScenario((prev) => ({
        ...prev,
        purchase_price: purchasePrice,
        taxes: annualTaxes,
      }));
      setScenarioName(`${p.address} - ${rentalType.toUpperCase()}`);
    }
  };

  // Load a saved scenario
  const loadScenario = (scenario: SavedScenario) => {
    setScenarioId(scenario.id);
    setScenarioName(scenario.name);
    setRentalType(scenario.rental_type as RentalType);

    const data = scenario.scenario_data as Record<string, unknown>;

    if (scenario.rental_type === 'ltr') {
      setLtrScenario({
        prospect_id: scenario.prospect_id,
        property_id: scenario.property_id,
        name: scenario.name,
        is_default: false,
        purchase_price: Number(data.purchase_price) || defaultLTRScenario.purchase_price,
        down_payment_pct: Number(data.down_payment_pct) || defaultLTRScenario.down_payment_pct,
        interest_rate: Number(data.interest_rate) || defaultLTRScenario.interest_rate,
        loan_term: Number(data.loan_term) || defaultLTRScenario.loan_term,
        closing_costs: Number(data.closing_costs) || defaultLTRScenario.closing_costs,
        rehab_budget: Number(data.rehab_budget) || defaultLTRScenario.rehab_budget,
        monthly_rent: Number(data.monthly_rent) || defaultLTRScenario.monthly_rent,
        vacancy_rate: Number(data.vacancy_rate) || defaultLTRScenario.vacancy_rate,
        property_mgmt_pct: Number(data.property_mgmt_pct) || defaultLTRScenario.property_mgmt_pct,
        insurance: Number(data.insurance) || defaultLTRScenario.insurance,
        taxes: Number(data.taxes) || defaultLTRScenario.taxes,
        maintenance_reserve_pct: Number(data.maintenance_reserve_pct) || defaultLTRScenario.maintenance_reserve_pct,
        hoa: Number(data.hoa) || defaultLTRScenario.hoa,
        utilities: Number(data.utilities) || defaultLTRScenario.utilities,
        appreciation_rate: Number(data.appreciation_rate) || defaultLTRScenario.appreciation_rate,
        rent_growth_rate: Number(data.rent_growth_rate) || defaultLTRScenario.rent_growth_rate,
      });
    } else {
      setStrScenario({
        purchase_price: Number(data.purchase_price) || defaultSTRScenario.purchase_price,
        down_payment_pct: Number(data.down_payment_pct) || defaultSTRScenario.down_payment_pct,
        interest_rate: Number(data.interest_rate) || defaultSTRScenario.interest_rate,
        loan_term: Number(data.loan_term) || defaultSTRScenario.loan_term,
        closing_costs: Number(data.closing_costs) || defaultSTRScenario.closing_costs,
        rehab_budget: Number(data.rehab_budget) || defaultSTRScenario.rehab_budget,
        avg_daily_rate: Number(data.avg_daily_rate) || defaultSTRScenario.avg_daily_rate,
        occupancy_rate: Number(data.occupancy_rate) || defaultSTRScenario.occupancy_rate,
        seasonality: (data.seasonality as number[]) || defaultSTRScenario.seasonality,
        seasonality_mode: (data.seasonality_mode as 'rate' | 'weight') || defaultSTRScenario.seasonality_mode,
        property_mgmt_pct: Number(data.property_mgmt_pct) || defaultSTRScenario.property_mgmt_pct,
        listing_service_pct: Number(data.listing_service_pct) || defaultSTRScenario.listing_service_pct,
        cleaning_cost_per_turnover: Number(data.cleaning_cost_per_turnover) || defaultSTRScenario.cleaning_cost_per_turnover,
        turnovers_per_year: Number(data.turnovers_per_year) || defaultSTRScenario.turnovers_per_year,
        capital_reserve_pct: Number(data.capital_reserve_pct) || defaultSTRScenario.capital_reserve_pct,
        insurance: Number(data.insurance) || defaultSTRScenario.insurance,
        taxes: Number(data.taxes) || defaultSTRScenario.taxes,
        hoa: Number(data.hoa) || defaultSTRScenario.hoa,
        utilities: Number(data.utilities) || defaultSTRScenario.utilities,
        appreciation_rate: Number(data.appreciation_rate) || defaultSTRScenario.appreciation_rate,
        adr_growth_rate: Number(data.adr_growth_rate) || defaultSTRScenario.adr_growth_rate,
      });
    }

    toast.success(`Loaded "${scenario.name}"`);
  };

  // Delete a scenario
  const handleDeleteScenario = async (id: string, name: string) => {
    if (!confirm(`Delete scenario "${name}"?`)) return;

    const result = await deleteScenarioAction(id);
    if (result.success) {
      setScenarios(scenarios.filter((s) => s.id !== id));
      if (scenarioId === id) {
        setScenarioId(null);
        setScenarioName('');
      }
      toast.success('Scenario deleted');
    } else {
      toast.error(result.error || 'Failed to delete scenario');
    }
  };

  // Start a new scenario
  const handleNewScenario = () => {
    setScenarioId(null);
    setScenarioName('');
    setLtrScenario(defaultLTRScenario);
    setStrScenario(defaultSTRScenario);
    toast.success('Started new scenario');
  };

  // Load initial scenario if provided
  useEffect(() => {
    if (initialScenarioId && savedScenarios.length > 0) {
      const scenario = savedScenarios.find((s) => s.id === initialScenarioId);
      if (scenario) {
        loadScenario(scenario);
      }
    }
  }, [initialScenarioId, savedScenarios]);

  // Pre-populate from initial prospect data
  useEffect(() => {
    if (initialProspect && !selectedProspect) {
      handleProspectChange(initialProspect.id);
    }
  }, [initialProspect]);

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

  const handleSaveScenario = async () => {
    if (!scenarioName.trim()) {
      toast.error('Please enter a name for this scenario.');
      return;
    }

    setIsSaving(true);
    try {
      const scenarioData = rentalType === 'ltr' ? ltrScenario : strScenario;

      const result = await saveScenarioAction({
        id: scenarioId || undefined,
        prospect_id: selectedProspect?.id || null,
        name: scenarioName,
        rental_type: rentalType,
        scenario_data: scenarioData as Record<string, unknown>,
      });

      if (result.success) {
        toast.success(`"${scenarioName}" has been saved successfully.`);
        setSaveDialogOpen(false);
        if (result.data) {
          setScenarioId(result.data.id);
          // Update local scenarios list
          const existingIndex = scenarios.findIndex((s) => s.id === result.data!.id);
          if (existingIndex >= 0) {
            setScenarios(scenarios.map((s, i) => (i === existingIndex ? result.data! : s)));
          } else {
            setScenarios([result.data, ...scenarios]);
          }
        }
      } else {
        toast.error(result.error || 'An error occurred while saving.');
      }
    } catch (error) {
      toast.error('An unexpected error occurred.');
    } finally {
      setIsSaving(false);
    }
  };

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
          {selectedProspect && (
            <Button variant="ghost" size="icon" asChild>
              <Link href={`/prospects/${selectedProspect.id}`}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
          )}
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Proforma Calculator</h1>
            {selectedProspect ? (
              <p className="text-muted-foreground flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {selectedProspect.address}, {selectedProspect.city}, {selectedProspect.state}
              </p>
            ) : (
              <p className="text-muted-foreground">
                Analyze investment returns with detailed financial projections
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Prospect Selector */}
          {prospects.length > 0 && (
            <Select
              value={selectedProspect?.id || 'none'}
              onValueChange={handleProspectChange}
            >
              <SelectTrigger className="w-[220px]">
                <Home className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Select prospect..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Property Selected</SelectItem>
                {prospects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.address}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Load Saved Scenarios */}
          {scenarios.length > 0 && (
            <Select
              value={scenarioId || ''}
              onValueChange={(value) => {
                if (value === 'new') {
                  handleNewScenario();
                } else {
                  const scenario = scenarios.find((s) => s.id === value);
                  if (scenario) loadScenario(scenario);
                }
              }}
            >
              <SelectTrigger className="w-[200px]">
                <FolderOpen className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Load scenario..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">+ New Scenario</SelectItem>
                {scenarios.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} ({s.rental_type.toUpperCase()})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Delete Current Scenario */}
          {scenarioId && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleDeleteScenario(scenarioId, scenarioName)}
              title="Delete this scenario"
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          )}

          {/* Save Scenario */}
          <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                if (!scenarioName && selectedProspect) {
                  setScenarioName(`${selectedProspect.address} - ${rentalType.toUpperCase()}`);
                }
              }}>
                <Save className="mr-2 h-4 w-4" />
                {scenarioId ? 'Update' : 'Save'}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{scenarioId ? 'Update Scenario' : 'Save Scenario'}</DialogTitle>
                <DialogDescription>
                  {scenarioId ? 'Update' : 'Save'} this {rentalType === 'ltr' ? 'long-term rental' : 'short-term rental'} analysis.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="scenario-name">Scenario Name</Label>
                  <Input
                    id="scenario-name"
                    value={scenarioName}
                    onChange={(e) => setScenarioName(e.target.value)}
                    placeholder="e.g., Conservative estimate"
                  />
                </div>
                {selectedProspect && (
                  <p className="text-sm text-muted-foreground">
                    Linked to: {selectedProspect.address}
                  </p>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveScenario} disabled={isSaving}>
                  {isSaving ? 'Saving...' : scenarioId ? 'Update' : 'Save'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
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
      {selectedProspect && (
        <Card className="bg-muted/50">
          <CardContent className="py-4">
            <div className="flex flex-wrap gap-6 text-sm">
              <div>
                <span className="text-muted-foreground">Property: </span>
                <span className="font-medium">{selectedProspect.address}</span>
              </div>
              {selectedProspect.bedrooms && (
                <div>
                  <span className="text-muted-foreground">Beds/Baths: </span>
                  <span className="font-medium">{selectedProspect.bedrooms}bd / {selectedProspect.bathrooms}ba</span>
                </div>
              )}
              {selectedProspect.sqft && (
                <div>
                  <span className="text-muted-foreground">Sqft: </span>
                  <span className="font-medium">{selectedProspect.sqft.toLocaleString()}</span>
                </div>
              )}
              <Badge variant="secondary">{selectedProspect.property_type?.replace('_', ' ')}</Badge>
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
                  <Label>Down Payment $</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      className="pl-8"
                      value={Math.round(
                        rentalType === 'ltr'
                          ? (ltrScenario.purchase_price * ltrScenario.down_payment_pct) / 100
                          : (strScenario.purchase_price * strScenario.down_payment_pct) / 100
                      )}
                      onChange={(e) => {
                        const dollarVal = Number(e.target.value);
                        const purchasePrice = rentalType === 'ltr' ? ltrScenario.purchase_price : strScenario.purchase_price;
                        const pct = purchasePrice > 0 ? Math.round((dollarVal / purchasePrice) * 100 * 100) / 100 : 0;
                        if (rentalType === 'ltr') {
                          updateLtrScenario('down_payment_pct', pct);
                        } else {
                          updateStrScenario('down_payment_pct', pct);
                        }
                      }}
                    />
                  </div>
                </div>
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Occupancy Rate %</Label>
                    <Input
                      type="number"
                      value={strScenario.occupancy_rate}
                      onChange={(e) => updateStrScenario('occupancy_rate', Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Total Nights/Year</Label>
                    <Input
                      type="number"
                      value={Math.round(365 * (strScenario.occupancy_rate / 100))}
                      onChange={(e) => {
                        const nights = Number(e.target.value);
                        const occupancy = Math.round((nights / 365) * 100 * 10) / 10;
                        updateStrScenario('occupancy_rate', occupancy);
                      }}
                    />
                  </div>
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

          {/* Financing Options (Refinance & HELOC) */}
          <Card>
            <CardHeader
              className="cursor-pointer"
              onClick={() => setFinancingExpanded(!financingExpanded)}
            >
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Landmark className="h-5 w-5" />
                  Financing Options
                </div>
                {financingExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </CardTitle>
              {!financingExpanded && (refinanceEnabled || helocEnabled) && (
                <CardDescription>
                  {refinanceEnabled && `Refinance Year ${refinanceYear}`}
                  {refinanceEnabled && helocEnabled && ' • '}
                  {helocEnabled && `HELOC Year ${helocYear}`}
                </CardDescription>
              )}
            </CardHeader>
            {financingExpanded && (
              <CardContent className="space-y-6">
                {/* Refinance Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4" />
                      <Label className="text-base font-medium">Refinance</Label>
                    </div>
                    <Button
                      variant={refinanceEnabled ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setRefinanceEnabled(!refinanceEnabled)}
                    >
                      {refinanceEnabled ? 'Enabled' : 'Disabled'}
                    </Button>
                  </div>
                  {refinanceEnabled && (
                    <div className="space-y-4 pl-6 border-l-2 border-primary/20">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Refinance in Year</Label>
                          <Input
                            type="number"
                            min="1"
                            value={refinanceYear}
                            onChange={(e) => setRefinanceYear(Number(e.target.value))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>New Interest Rate %</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={refinanceRate}
                            onChange={(e) => setRefinanceRate(Number(e.target.value))}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>New Loan Term (years)</Label>
                          <Input
                            type="number"
                            value={refinanceTerm}
                            onChange={(e) => setRefinanceTerm(Number(e.target.value))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Cash Out Amount</Label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="number"
                              value={refinanceCashOut}
                              onChange={(e) => setRefinanceCashOut(Number(e.target.value))}
                              className="pl-8"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Closing Costs</Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="number"
                            value={refinanceClosingCosts}
                            onChange={(e) => setRefinanceClosingCosts(Number(e.target.value))}
                            className="pl-8"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                {/* HELOC Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Landmark className="h-4 w-4" />
                      <Label className="text-base font-medium">Home Equity Loan / HELOC</Label>
                    </div>
                    <Button
                      variant={helocEnabled ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setHelocEnabled(!helocEnabled)}
                    >
                      {helocEnabled ? 'Enabled' : 'Disabled'}
                    </Button>
                  </div>
                  {helocEnabled && (
                    <div className="space-y-4 pl-6 border-l-2 border-primary/20">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Take HELOC in Year</Label>
                          <Input
                            type="number"
                            min="1"
                            value={helocYear}
                            onChange={(e) => setHelocYear(Number(e.target.value))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>HELOC Amount</Label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="number"
                              value={helocAmount}
                              onChange={(e) => setHelocAmount(Number(e.target.value))}
                              className="pl-8"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Interest Rate %</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={helocRate}
                            onChange={(e) => setHelocRate(Number(e.target.value))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Repayment Term (years)</Label>
                          <Input
                            type="number"
                            value={helocTerm}
                            onChange={(e) => setHelocTerm(Number(e.target.value))}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Draw Period (years)</Label>
                        <Input
                          type="number"
                          value={helocDrawPeriod}
                          onChange={(e) => setHelocDrawPeriod(Number(e.target.value))}
                        />
                        <p className="text-xs text-muted-foreground">
                          Interest-only payments during draw period
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            )}
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

          {/* Financing Scenarios Impact */}
          {(refinanceEnabled || helocEnabled) && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Landmark className="h-4 w-4" />
                  Financing Scenario Impact
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  {refinanceEnabled && (() => {
                    const purchasePrice = rentalType === 'ltr' ? ltrScenario.purchase_price : strScenario.purchase_price;
                    const appreciationRate = rentalType === 'ltr' ? ltrScenario.appreciation_rate : strScenario.appreciation_rate;
                    const futureValue = purchasePrice * Math.pow(1 + appreciationRate / 100, refinanceYear);
                    const currentLoanBalance = results.loanAmount * (1 - refinanceYear / (rentalType === 'ltr' ? ltrScenario.loan_term : strScenario.loan_term) * 0.3); // Simplified
                    const maxLTV = futureValue * 0.75;
                    const newLoanAmount = Math.min(maxLTV, currentLoanBalance + refinanceCashOut);
                    const monthlyPayment = (newLoanAmount * (refinanceRate / 100 / 12)) / (1 - Math.pow(1 + refinanceRate / 100 / 12, -refinanceTerm * 12));

                    return (
                      <div className="p-3 bg-white rounded-lg">
                        <div className="flex items-center gap-2 font-medium mb-2">
                          <RefreshCw className="h-4 w-4" />
                          Refinance in Year {refinanceYear}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Est. Property Value:</span>
                            <span>{formatCurrency(futureValue)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Max Loan (75% LTV):</span>
                            <span>{formatCurrency(maxLTV)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Cash Out:</span>
                            <span className="text-green-600">{formatCurrency(refinanceCashOut)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">New Payment:</span>
                            <span>{formatCurrency(monthlyPayment)}/mo</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {helocEnabled && (() => {
                    const monthlyInterest = (helocAmount * (helocRate / 100)) / 12;
                    const fullPayment = (helocAmount * (helocRate / 100 / 12)) / (1 - Math.pow(1 + helocRate / 100 / 12, -helocTerm * 12));

                    return (
                      <div className="p-3 bg-white rounded-lg">
                        <div className="flex items-center gap-2 font-medium mb-2">
                          <Landmark className="h-4 w-4" />
                          HELOC in Year {helocYear}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">HELOC Amount:</span>
                            <span className="text-green-600">{formatCurrency(helocAmount)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Interest Rate:</span>
                            <span>{helocRate}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Draw Period Payment:</span>
                            <span>{formatCurrency(monthlyInterest)}/mo</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Repayment Period:</span>
                            <span>{formatCurrency(fullPayment)}/mo</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </CardContent>
            </Card>
          )}

          {/* STR-specific metrics */}
          {rentalType === 'str' && (
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Annual Nights Booked</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Math.round(365 * (strScenario.occupancy_rate / 100))}
                  </div>
                  <p className="text-xs text-muted-foreground">{strScenario.occupancy_rate}% occupancy</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Annual Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(results.grossAnnualRent)}</div>
                  <p className="text-xs text-muted-foreground">{formatCurrency(results.grossMonthlyRent)}/mo avg</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Effective ADR</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(results.grossAnnualRent / Math.round(365 * (strScenario.occupancy_rate / 100)))}
                  </div>
                  <p className="text-xs text-muted-foreground">Revenue per night booked</p>
                </CardContent>
              </Card>
            </div>
          )}

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
                      <YAxis tickFormatter={(value) => formatCurrencyCompact(value)} />
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
                      <YAxis tickFormatter={(value) => formatCurrencyCompact(value)} />
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
