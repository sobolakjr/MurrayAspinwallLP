// Database types for Rental Property Investment Manager

export type PropertyType = 'single_family' | 'multi_family' | 'condo' | 'townhouse' | 'duplex' | 'triplex' | 'fourplex';
export type PropertyStatus = 'own' | 'sold' | 'rented' | 'listed_rent' | 'listed_sell' | 'reno_changeover' | 'listed_str';
export type ProspectStatus = 'researching' | 'offer_made' | 'passed' | 'won' | 'lost';
export type TenantStatus = 'active' | 'past' | 'pending';
export type TransactionType = 'income' | 'expense';
export type ImportSource = 'manual' | 'csv' | 'plaid';
export type MaintenanceCategory = 'plumbing' | 'electrical' | 'hvac' | 'appliance' | 'structural' | 'cosmetic' | 'landscaping' | 'other';
export type MaintenanceStatus = 'pending' | 'in_progress' | 'completed';
export type DocumentType = 'lease' | 'inspection' | 'insurance' | 'tax' | 'deed' | 'contract' | 'other';
export type BankAccountType = 'checking' | 'savings' | 'credit_card' | 'investment' | 'other';
export type ServiceProviderType = 'plumbing' | 'electrical' | 'hvac' | 'landscaping' | 'cleaning' | 'roofing' | 'general_contractor' | 'pest_control' | 'appliance_repair' | 'locksmith' | 'attorney' | 'accountant' | 'insurance' | 'other';

export interface BankAccount {
  id: string;
  name: string;
  institution: string | null;
  account_type: BankAccountType;
  account_number_last4: string | null;
  current_balance: number | null;
  is_default: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Property {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  purchase_price: number | null;
  purchase_date: string | null;
  current_value: number | null;
  mortgage_balance: number | null;
  mortgage_rate: number | null;
  mortgage_payment: number | null;
  property_type: PropertyType | null;
  bedrooms: number | null;
  bathrooms: number | null;
  sqft: number | null;
  lot_size: number | null;
  year_built: number | null;
  status: PropertyStatus;
  monthly_rent: number | null;
  avg_nightly_rent: number | null;
  // Sold property fields
  sold_price: number | null;
  sold_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Prospect {
  id: string;
  mls_number: string | null;
  address: string;
  city: string;
  state: string;
  zip: string;
  list_price: number | null;
  listing_urls: string[] | null;
  property_type: PropertyType | null;
  bedrooms: number | null;
  bathrooms: number | null;
  sqft: number | null;
  lot_size: number | null;
  year_built: number | null;
  days_on_market: number | null;
  // Realtor info
  realtor_name: string | null;
  realtor_phone: string | null;
  realtor_email: string | null;
  realtor_company: string | null;
  status: ProspectStatus;
  api_data: Record<string, unknown> | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProformaScenario {
  id: string;
  prospect_id: string | null;
  property_id: string | null;
  name: string;
  is_default: boolean;
  // Purchase
  purchase_price: number;
  down_payment_pct: number;
  interest_rate: number;
  loan_term: number;
  closing_costs: number;
  rehab_budget: number;
  // Income
  monthly_rent: number;
  vacancy_rate: number;
  // Expenses
  property_mgmt_pct: number;
  insurance: number;
  taxes: number;
  maintenance_reserve_pct: number;
  hoa: number;
  utilities: number;
  // Growth
  appreciation_rate: number;
  rent_growth_rate: number;
  created_at: string;
  updated_at: string;
}

export interface FeedbackChecklist {
  location: number; // 1-5
  condition: number;
  layout: number;
  rental_potential: number;
  rehab_needed: number;
  deal_quality: number;
}

export interface FeedbackEntry {
  id: string;
  prospect_id: string;
  visit_date: string;
  overall_rating: number | null;
  checklist_responses: FeedbackChecklist;
  notes: string | null;
  pros: string[];
  cons: string[];
  photos: string[];
  created_at: string;
}

export interface Tenant {
  id: string;
  property_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  lease_start: string | null;
  lease_end: string | null;
  rent_amount: number | null;
  security_deposit: number | null;
  status: TenantStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  property_id: string | null;
  bank_account_id: string | null;
  date: string;
  amount: number;
  type: TransactionType;
  category: string;
  description: string | null;
  vendor: string | null;
  imported_from: ImportSource;
  external_id: string | null;
  created_at: string;
}

export interface MaintenanceRecord {
  id: string;
  property_id: string;
  date: string;
  description: string;
  cost: number | null;
  vendor: string | null;
  category: MaintenanceCategory | null;
  status: MaintenanceStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  property_id: string | null;
  prospect_id: string | null;
  name: string;
  type: DocumentType | null;
  file_url: string;
  file_size: number | null;
  created_at: string;
}

// Proforma calculation results
export interface ProformaResults {
  // Monthly figures
  grossMonthlyRent: number;
  effectiveGrossIncome: number;
  totalMonthlyExpenses: number;
  monthlyMortgagePayment: number;
  monthlyCashFlow: number;

  // Annual figures
  grossAnnualRent: number;
  annualVacancyLoss: number;
  effectiveGrossAnnualIncome: number;
  totalAnnualExpenses: number;
  annualDebtService: number;
  annualCashFlow: number;
  noi: number; // Net Operating Income (before debt service)

  // Investment metrics
  totalCashInvested: number;
  loanAmount: number;
  capRate: number;
  cashOnCashReturn: number;
  dscr: number; // Debt Service Coverage Ratio

  // Projections
  yearlyProjections: YearlyProjection[];
  irr: number;
  npv: number;
}

export interface YearlyProjection {
  year: number;
  propertyValue: number;
  equity: number;
  annualRent: number;
  annualCashFlow: number;
  cumulativeCashFlow: number;
  loanBalance: number;
}

// Transaction categories
export const INCOME_CATEGORIES = [
  'Rent',
  'Late Fee',
  'Pet Fee',
  'Application Fee',
  'Security Deposit',
  'Other Income',
] as const;

export const EXPENSE_CATEGORIES = [
  'Mortgage',
  'Insurance',
  'Property Tax',
  'HOA',
  'Utilities',
  'Repairs',
  'Maintenance',
  'Property Management',
  'Landscaping',
  'Pest Control',
  'Legal',
  'Advertising',
  'Supplies',
  'Travel',
  'Other Expense',
] as const;

export type IncomeCategory = typeof INCOME_CATEGORIES[number];
export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];

// Neighbor contact for a property
export interface Neighbor {
  id: string;
  property_id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  relationship: string | null; // e.g., "left", "right", "across", "behind"
  notes: string | null;
  created_at: string;
}

// Codes, passwords, and key holders for a property
export interface PropertyCode {
  id: string;
  property_id: string;
  name: string; // e.g., "Front door", "Garage", "WiFi", "Alarm"
  code_type: 'lock_code' | 'password' | 'key_holder' | 'gate_code' | 'other';
  value: string | null; // The actual code/password
  holder_name: string | null; // Who has a key
  holder_phone: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Service provider
export interface ServiceProvider {
  id: string;
  name: string;
  type: ServiceProviderType;
  phone: string | null;
  email: string | null;
  website: string | null;
  contact_name: string | null;
  rating: number | null; // 1-5 stars
  total_spend: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Budget entry for a property
export interface BudgetEntry {
  id: string;
  property_id: string;
  year: number;
  category: string;
  annual_amount: number | null;
  monthly_amounts: number[] | null; // Array of 12 monthly values
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Service provider categories
export const SERVICE_PROVIDER_TYPES: ServiceProviderType[] = [
  'plumbing',
  'electrical',
  'hvac',
  'landscaping',
  'cleaning',
  'roofing',
  'general_contractor',
  'pest_control',
  'appliance_repair',
  'locksmith',
  'attorney',
  'accountant',
  'insurance',
  'other',
];

// Budget categories (same as expense categories plus some additions)
export const BUDGET_CATEGORIES = [
  'Mortgage',
  'Insurance',
  'Property Tax',
  'HOA',
  'Utilities',
  'Repairs',
  'Maintenance',
  'Property Management',
  'Landscaping',
  'Pest Control',
  'Capital Improvements',
  'Reserves',
  'Other',
] as const;

export type BudgetCategory = typeof BUDGET_CATEGORIES[number];

// User feedback for bugs and feature requests
export type UserFeedbackCategory = 'fix-me' | 'style-me' | 'bright-idea';

export interface UserFeedback {
  id: string;
  category: UserFeedbackCategory;
  message: string;
  user_email: string | null;
  created_at: string;
}
