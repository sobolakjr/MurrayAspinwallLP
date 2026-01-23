import type { ProformaScenario, ProformaResults, YearlyProjection } from '@/types';

/**
 * Calculate monthly mortgage payment using standard amortization formula
 */
export function calculateMonthlyMortgage(
  principal: number,
  annualRate: number,
  termYears: number
): number {
  if (principal <= 0 || termYears <= 0) return 0;
  if (annualRate <= 0) return principal / (termYears * 12);

  const monthlyRate = annualRate / 100 / 12;
  const numPayments = termYears * 12;

  return (
    (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
    (Math.pow(1 + monthlyRate, numPayments) - 1)
  );
}

/**
 * Calculate remaining loan balance after n months
 */
export function calculateLoanBalance(
  principal: number,
  annualRate: number,
  termYears: number,
  monthsPaid: number
): number {
  if (principal <= 0 || monthsPaid >= termYears * 12) return 0;
  if (annualRate <= 0) return principal - (principal / (termYears * 12)) * monthsPaid;

  const monthlyRate = annualRate / 100 / 12;
  const monthlyPayment = calculateMonthlyMortgage(principal, annualRate, termYears);

  return (
    principal * Math.pow(1 + monthlyRate, monthsPaid) -
    (monthlyPayment * (Math.pow(1 + monthlyRate, monthsPaid) - 1)) / monthlyRate
  );
}

/**
 * Calculate Internal Rate of Return (IRR) using Newton-Raphson method
 */
export function calculateIRR(cashFlows: number[], guess = 0.1): number {
  const maxIterations = 100;
  const tolerance = 0.0001;
  let rate = guess;

  for (let i = 0; i < maxIterations; i++) {
    let npv = 0;
    let derivative = 0;

    for (let j = 0; j < cashFlows.length; j++) {
      npv += cashFlows[j] / Math.pow(1 + rate, j);
      derivative -= (j * cashFlows[j]) / Math.pow(1 + rate, j + 1);
    }

    if (Math.abs(derivative) < 1e-10) break;

    const newRate = rate - npv / derivative;

    if (Math.abs(newRate - rate) < tolerance) {
      return newRate * 100;
    }

    rate = newRate;
  }

  return rate * 100;
}

/**
 * Calculate Net Present Value (NPV)
 */
export function calculateNPV(cashFlows: number[], discountRate: number): number {
  const rate = discountRate / 100;
  return cashFlows.reduce((npv, cf, year) => {
    return npv + cf / Math.pow(1 + rate, year);
  }, 0);
}

/**
 * Calculate complete proforma analysis
 */
export function calculateProforma(
  scenario: ProformaScenario,
  projectionYears = 30,
  discountRate = 8
): ProformaResults {
  // Calculate loan details
  const downPayment = scenario.purchase_price * (scenario.down_payment_pct / 100);
  const loanAmount = scenario.purchase_price - downPayment;
  const totalCashInvested = downPayment + scenario.closing_costs + scenario.rehab_budget;

  // Monthly figures
  const grossMonthlyRent = scenario.monthly_rent;
  const monthlyVacancyLoss = grossMonthlyRent * (scenario.vacancy_rate / 100);
  const effectiveGrossIncome = grossMonthlyRent - monthlyVacancyLoss;

  const monthlyMortgagePayment = calculateMonthlyMortgage(
    loanAmount,
    scenario.interest_rate,
    scenario.loan_term
  );

  // Monthly expenses (excluding mortgage)
  const monthlyInsurance = scenario.insurance / 12;
  const monthlyTaxes = scenario.taxes / 12;
  const monthlyMaintenance = grossMonthlyRent * (scenario.maintenance_reserve_pct / 100);
  const monthlyPropMgmt = grossMonthlyRent * (scenario.property_mgmt_pct / 100);
  const monthlyHoa = scenario.hoa;
  const monthlyUtilities = scenario.utilities;

  const totalMonthlyExpenses =
    monthlyInsurance +
    monthlyTaxes +
    monthlyMaintenance +
    monthlyPropMgmt +
    monthlyHoa +
    monthlyUtilities;

  const monthlyCashFlow = effectiveGrossIncome - totalMonthlyExpenses - monthlyMortgagePayment;

  // Annual figures
  const grossAnnualRent = grossMonthlyRent * 12;
  const annualVacancyLoss = monthlyVacancyLoss * 12;
  const effectiveGrossAnnualIncome = effectiveGrossIncome * 12;
  const totalAnnualExpenses = totalMonthlyExpenses * 12;
  const annualDebtService = monthlyMortgagePayment * 12;
  const annualCashFlow = monthlyCashFlow * 12;
  const noi = effectiveGrossAnnualIncome - totalAnnualExpenses;

  // Key metrics
  const capRate = scenario.purchase_price > 0 ? (noi / scenario.purchase_price) * 100 : 0;
  const cashOnCashReturn = totalCashInvested > 0 ? (annualCashFlow / totalCashInvested) * 100 : 0;
  const dscr = annualDebtService > 0 ? noi / annualDebtService : 0;

  // Year-by-year projections
  const yearlyProjections: YearlyProjection[] = [];
  let cumulativeCashFlow = 0;
  let currentPropertyValue = scenario.purchase_price;
  let currentAnnualRent = grossAnnualRent;

  // Cash flows for IRR calculation (year 0 is initial investment as negative)
  const cashFlowsForIRR: number[] = [-totalCashInvested];

  for (let year = 1; year <= projectionYears; year++) {
    // Apply appreciation
    currentPropertyValue *= (1 + scenario.appreciation_rate / 100);

    // Apply rent growth
    if (year > 1) {
      currentAnnualRent *= (1 + scenario.rent_growth_rate / 100);
    }

    // Recalculate cash flow with new rent
    const yearEffectiveIncome = currentAnnualRent * (1 - scenario.vacancy_rate / 100);
    const yearExpenses = (
      scenario.insurance +
      scenario.taxes +
      currentAnnualRent * (scenario.maintenance_reserve_pct / 100) +
      currentAnnualRent * (scenario.property_mgmt_pct / 100) +
      scenario.hoa * 12 +
      scenario.utilities * 12
    );
    const yearCashFlow = yearEffectiveIncome - yearExpenses - annualDebtService;

    cumulativeCashFlow += yearCashFlow;

    const loanBalance = calculateLoanBalance(
      loanAmount,
      scenario.interest_rate,
      scenario.loan_term,
      year * 12
    );

    const equity = currentPropertyValue - loanBalance;

    yearlyProjections.push({
      year,
      propertyValue: currentPropertyValue,
      equity,
      annualRent: currentAnnualRent,
      annualCashFlow: yearCashFlow,
      cumulativeCashFlow,
      loanBalance,
    });

    // For IRR, add cash flow (and equity on sale in final year)
    if (year === projectionYears) {
      // Assume sale at end with 6% selling costs
      const netSaleProceeds = currentPropertyValue * 0.94 - loanBalance;
      cashFlowsForIRR.push(yearCashFlow + netSaleProceeds);
    } else {
      cashFlowsForIRR.push(yearCashFlow);
    }
  }

  // Calculate IRR and NPV
  const irr = calculateIRR(cashFlowsForIRR);
  const npv = calculateNPV(cashFlowsForIRR, discountRate);

  return {
    grossMonthlyRent,
    effectiveGrossIncome,
    totalMonthlyExpenses,
    monthlyMortgagePayment,
    monthlyCashFlow,
    grossAnnualRent,
    annualVacancyLoss,
    effectiveGrossAnnualIncome,
    totalAnnualExpenses,
    annualDebtService,
    annualCashFlow,
    noi,
    totalCashInvested,
    loanAmount,
    capRate,
    cashOnCashReturn,
    dscr,
    yearlyProjections,
    irr,
    npv,
  };
}

/**
 * Format currency for display
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format percentage for display
 */
export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Short-term rental scenario interface
 */
export interface STRScenario {
  // Purchase
  purchase_price: number;
  down_payment_pct: number;
  interest_rate: number;
  loan_term: number;
  closing_costs: number;
  rehab_budget: number;
  // STR Income
  avg_daily_rate: number;
  occupancy_rate: number; // percentage
  seasonality: number[]; // 12 months, either $ daily rate or weight multiplier
  seasonality_mode: 'rate' | 'weight'; // whether seasonality is absolute rates or weights
  // STR Expenses
  property_mgmt_pct: number;
  listing_service_pct: number; // Airbnb, VRBO fees
  cleaning_cost_per_turnover: number;
  turnovers_per_year: number;
  capital_reserve_pct: number;
  // Fixed Expenses
  insurance: number;
  taxes: number;
  hoa: number;
  utilities: number;
  // Growth
  appreciation_rate: number;
  adr_growth_rate: number;
}

/**
 * Default monthly weights (equal distribution)
 */
export const DEFAULT_SEASONALITY_WEIGHTS = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];

/**
 * Month names for display
 */
export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Calculate STR annual revenue with seasonality
 */
export function calculateSTRRevenue(
  avgDailyRate: number,
  occupancyRate: number,
  seasonality: number[],
  seasonalityMode: 'rate' | 'weight'
): { monthlyRevenue: number[]; annualRevenue: number } {
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const monthlyRevenue: number[] = [];

  for (let i = 0; i < 12; i++) {
    const dailyRate = seasonalityMode === 'rate'
      ? seasonality[i]
      : avgDailyRate * seasonality[i];
    const occupiedDays = daysInMonth[i] * (occupancyRate / 100);
    monthlyRevenue.push(dailyRate * occupiedDays);
  }

  const annualRevenue = monthlyRevenue.reduce((sum, m) => sum + m, 0);
  return { monthlyRevenue, annualRevenue };
}

/**
 * Calculate STR proforma analysis
 */
export function calculateSTRProforma(
  scenario: STRScenario,
  projectionYears = 30,
  discountRate = 8
): ProformaResults {
  // Calculate loan details
  const downPayment = scenario.purchase_price * (scenario.down_payment_pct / 100);
  const loanAmount = scenario.purchase_price - downPayment;
  const totalCashInvested = downPayment + scenario.closing_costs + scenario.rehab_budget;

  // Calculate STR revenue
  const { annualRevenue } = calculateSTRRevenue(
    scenario.avg_daily_rate,
    scenario.occupancy_rate,
    scenario.seasonality,
    scenario.seasonality_mode
  );

  const grossAnnualRent = annualRevenue;
  const grossMonthlyRent = annualRevenue / 12;

  // STR-specific expenses
  const annualListingFees = grossAnnualRent * (scenario.listing_service_pct / 100);
  const annualCleaningCosts = scenario.cleaning_cost_per_turnover * scenario.turnovers_per_year;
  const annualCapitalReserve = grossAnnualRent * (scenario.capital_reserve_pct / 100);
  const annualPropMgmt = grossAnnualRent * (scenario.property_mgmt_pct / 100);

  // Fixed expenses
  const annualInsurance = scenario.insurance;
  const annualTaxes = scenario.taxes;
  const annualHoa = scenario.hoa * 12;
  const annualUtilities = scenario.utilities * 12;

  // No vacancy concept in STR (occupancy is already factored in)
  const annualVacancyLoss = 0;
  const effectiveGrossAnnualIncome = grossAnnualRent;

  // Total expenses
  const totalAnnualExpenses =
    annualListingFees +
    annualCleaningCosts +
    annualCapitalReserve +
    annualPropMgmt +
    annualInsurance +
    annualTaxes +
    annualHoa +
    annualUtilities;

  const totalMonthlyExpenses = totalAnnualExpenses / 12;

  // Mortgage
  const monthlyMortgagePayment = calculateMonthlyMortgage(
    loanAmount,
    scenario.interest_rate,
    scenario.loan_term
  );
  const annualDebtService = monthlyMortgagePayment * 12;

  // Cash flow
  const noi = effectiveGrossAnnualIncome - totalAnnualExpenses;
  const annualCashFlow = noi - annualDebtService;
  const monthlyCashFlow = annualCashFlow / 12;
  const effectiveGrossIncome = grossMonthlyRent;

  // Key metrics
  const capRate = scenario.purchase_price > 0 ? (noi / scenario.purchase_price) * 100 : 0;
  const cashOnCashReturn = totalCashInvested > 0 ? (annualCashFlow / totalCashInvested) * 100 : 0;
  const dscr = annualDebtService > 0 ? noi / annualDebtService : 0;

  // Year-by-year projections
  const yearlyProjections: YearlyProjection[] = [];
  let cumulativeCashFlow = 0;
  let currentPropertyValue = scenario.purchase_price;
  let currentAnnualRevenue = grossAnnualRent;

  const cashFlowsForIRR: number[] = [-totalCashInvested];

  for (let year = 1; year <= projectionYears; year++) {
    currentPropertyValue *= (1 + scenario.appreciation_rate / 100);

    if (year > 1) {
      currentAnnualRevenue *= (1 + scenario.adr_growth_rate / 100);
    }

    const yearExpenses = (
      currentAnnualRevenue * (scenario.listing_service_pct / 100) +
      scenario.cleaning_cost_per_turnover * scenario.turnovers_per_year +
      currentAnnualRevenue * (scenario.capital_reserve_pct / 100) +
      currentAnnualRevenue * (scenario.property_mgmt_pct / 100) +
      annualInsurance + annualTaxes + annualHoa + annualUtilities
    );

    const yearCashFlow = currentAnnualRevenue - yearExpenses - annualDebtService;
    cumulativeCashFlow += yearCashFlow;

    const loanBalance = calculateLoanBalance(
      loanAmount,
      scenario.interest_rate,
      scenario.loan_term,
      year * 12
    );

    const equity = currentPropertyValue - loanBalance;

    yearlyProjections.push({
      year,
      propertyValue: currentPropertyValue,
      equity,
      annualRent: currentAnnualRevenue,
      annualCashFlow: yearCashFlow,
      cumulativeCashFlow,
      loanBalance,
    });

    if (year === projectionYears) {
      const netSaleProceeds = currentPropertyValue * 0.94 - loanBalance;
      cashFlowsForIRR.push(yearCashFlow + netSaleProceeds);
    } else {
      cashFlowsForIRR.push(yearCashFlow);
    }
  }

  const irr = calculateIRR(cashFlowsForIRR);
  const npv = calculateNPV(cashFlowsForIRR, discountRate);

  return {
    grossMonthlyRent,
    effectiveGrossIncome,
    totalMonthlyExpenses,
    monthlyMortgagePayment,
    monthlyCashFlow,
    grossAnnualRent,
    annualVacancyLoss,
    effectiveGrossAnnualIncome,
    totalAnnualExpenses,
    annualDebtService,
    annualCashFlow,
    noi,
    totalCashInvested,
    loanAmount,
    capRate,
    cashOnCashReturn,
    dscr,
    yearlyProjections,
    irr,
    npv,
  };
}
