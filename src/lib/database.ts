import { supabase } from './supabase';
import type {
  Property,
  Prospect,
  Tenant,
  Transaction,
  MaintenanceRecord,
  ProformaScenario,
  FeedbackEntry,
  BankAccount,
  Neighbor,
  PropertyCode,
  ServiceProvider,
  BudgetEntry,
} from '@/types';

// ============ PROPERTIES ============

export async function getProperties() {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching properties:', error);
    return [];
  }
  return data as Property[];
}

export async function getProperty(id: string) {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching property:', error);
    return null;
  }
  return data as Property;
}

export async function createProperty(property: Omit<Property, 'id' | 'created_at' | 'updated_at'>) {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('properties')
    .insert(property)
    .select()
    .single();

  if (error) {
    console.error('Error creating property:', error);
    return null;
  }
  return data as Property;
}

export async function updateProperty(id: string, updates: Partial<Property>) {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('properties')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating property:', error);
    throw new Error(error.message || 'Database update failed');
  }
  return data as Property;
}

export async function deleteProperty(id: string) {
  if (!supabase) return false;

  const { error } = await supabase
    .from('properties')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting property:', error);
    return false;
  }
  return true;
}

// ============ PROSPECTS ============

export async function getProspects() {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('prospects')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching prospects:', error);
    return [];
  }
  return data as Prospect[];
}

export async function getProspect(id: string) {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('prospects')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching prospect:', error);
    return null;
  }
  return data as Prospect;
}

export async function createProspect(prospect: Omit<Prospect, 'id' | 'created_at' | 'updated_at'>) {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('prospects')
    .insert(prospect)
    .select()
    .single();

  if (error) {
    console.error('Error creating prospect:', error);
    return null;
  }
  return data as Prospect;
}

export async function updateProspect(id: string, updates: Partial<Prospect>) {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('prospects')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating prospect:', error);
    return null;
  }
  return data as Prospect;
}

export async function deleteProspect(id: string) {
  if (!supabase) return false;

  const { error } = await supabase
    .from('prospects')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting prospect:', error);
    return false;
  }
  return true;
}

// ============ TENANTS ============

export async function getTenantsByProperty(propertyId: string) {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('property_id', propertyId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching tenants:', error);
    return [];
  }
  return data as Tenant[];
}

export async function createTenant(tenant: Omit<Tenant, 'id' | 'created_at' | 'updated_at'>) {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('tenants')
    .insert(tenant)
    .select()
    .single();

  if (error) {
    console.error('Error creating tenant:', error);
    return null;
  }
  return data as Tenant;
}

// ============ TRANSACTIONS ============

export async function getTransactions(propertyId?: string) {
  if (!supabase) return [];

  let query = supabase
    .from('transactions')
    .select('*')
    .order('date', { ascending: false });

  if (propertyId) {
    query = query.eq('property_id', propertyId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
  return data as Transaction[];
}

export async function createTransaction(transaction: Omit<Transaction, 'id' | 'created_at'>) {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('transactions')
    .insert(transaction)
    .select()
    .single();

  if (error) {
    console.error('Error creating transaction:', error);
    return null;
  }
  return data as Transaction;
}

export async function createTransactions(transactions: Omit<Transaction, 'id' | 'created_at'>[]) {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('transactions')
    .insert(transactions)
    .select();

  if (error) {
    console.error('Error creating transactions:', error);
    return [];
  }
  return data as Transaction[];
}

export async function deleteTransaction(id: string) {
  if (!supabase) return false;

  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting transaction:', error);
    return false;
  }
  return true;
}

// ============ DOCUMENTS ============

export async function getDocuments() {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching documents:', error);
    return [];
  }
  return data;
}

export async function getDocumentsByProperty(propertyId: string) {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('property_id', propertyId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching documents:', error);
    return [];
  }
  return data;
}

export async function createDocument(document: {
  property_id?: string | null;
  prospect_id?: string | null;
  name: string;
  type: string;
  file_url: string;
  file_size?: number | null;
}) {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('documents')
    .insert(document)
    .select()
    .single();

  if (error) {
    console.error('Error creating document:', error);
    return null;
  }
  return data;
}

export async function deleteDocument(id: string) {
  if (!supabase) return false;

  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting document:', error);
    return false;
  }
  return true;
}

// ============ BANK ACCOUNTS ============

export async function getBankAccounts() {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('bank_accounts')
    .select('*')
    .order('is_default', { ascending: false })
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching bank accounts:', error);
    return [];
  }
  return data as BankAccount[];
}

export async function getBankAccount(id: string) {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('bank_accounts')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching bank account:', error);
    return null;
  }
  return data as BankAccount;
}

export async function createBankAccount(account: Omit<BankAccount, 'id' | 'created_at' | 'updated_at'>) {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('bank_accounts')
    .insert(account)
    .select()
    .single();

  if (error) {
    console.error('Error creating bank account:', error);
    return null;
  }
  return data as BankAccount;
}

export async function updateBankAccount(id: string, updates: Partial<BankAccount>) {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('bank_accounts')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating bank account:', error);
    return null;
  }
  return data as BankAccount;
}

export async function deleteBankAccount(id: string) {
  if (!supabase) return false;

  const { error } = await supabase
    .from('bank_accounts')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting bank account:', error);
    return false;
  }
  return true;
}

// ============ MAINTENANCE ============

export async function getMaintenanceByProperty(propertyId: string) {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('maintenance_records')
    .select('*')
    .eq('property_id', propertyId)
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching maintenance records:', error);
    return [];
  }
  return data as MaintenanceRecord[];
}

export async function createMaintenanceRecord(record: Omit<MaintenanceRecord, 'id' | 'created_at' | 'updated_at'>) {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('maintenance_records')
    .insert(record)
    .select()
    .single();

  if (error) {
    console.error('Error creating maintenance record:', error);
    return null;
  }
  return data as MaintenanceRecord;
}

// ============ DASHBOARD STATS ============

export async function getDashboardStats() {
  if (!supabase) {
    return {
      totalProperties: 0,
      portfolioValue: 0,
      totalEquity: 0,
      monthlyCashFlow: 0,
      monthlyRentIncome: 0,
      monthlyExpenses: 0,
      activeProspects: 0,
    };
  }

  // Get properties (all statuses except sold)
  const { data: properties } = await supabase
    .from('properties')
    .select('id, current_value, mortgage_balance, monthly_rent, mortgage_payment, status')
    .in('status', ['own', 'rented', 'listed_rent', 'listed_sell', 'reno_changeover', 'listed_str']);

  // Get active tenants for expected rent income
  const { data: tenants } = await supabase
    .from('tenants')
    .select('rent_amount')
    .eq('status', 'active');

  // Get active prospects count
  const { count: prospectsCount } = await supabase
    .from('prospects')
    .select('*', { count: 'exact', head: true })
    .in('status', ['researching', 'offer_made']);

  // Calculate stats
  const portfolioValue = properties?.reduce((sum, p) => sum + (Number(p.current_value) || 0), 0) || 0;
  const totalEquity = properties?.reduce((sum, p) =>
    sum + ((Number(p.current_value) || 0) - (Number(p.mortgage_balance) || 0)), 0) || 0;

  // Calculate expected monthly rent income from active tenants
  const monthlyRentIncome = tenants?.reduce((sum, t) => sum + (Number(t.rent_amount) || 0), 0) || 0;

  // If no tenant rent data, fall back to property monthly_rent for rented properties
  const fallbackRentIncome = monthlyRentIncome === 0
    ? properties?.filter(p => p.status === 'rented').reduce((sum, p) => sum + (Number(p.monthly_rent) || 0), 0) || 0
    : 0;

  const totalRentIncome = monthlyRentIncome + fallbackRentIncome;

  // Calculate expected monthly mortgage expenses
  const monthlyMortgage = properties?.reduce((sum, p) => sum + (Number(p.mortgage_payment) || 0), 0) || 0;

  return {
    totalProperties: properties?.length || 0,
    portfolioValue,
    totalEquity,
    monthlyCashFlow: totalRentIncome - monthlyMortgage,
    monthlyRentIncome: totalRentIncome,
    monthlyExpenses: monthlyMortgage,
    activeProspects: prospectsCount || 0,
  };
}

export async function getRecentProspects(limit = 5) {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('prospects')
    .select('*')
    .in('status', ['researching', 'offer_made'])
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching recent prospects:', error);
    return [];
  }
  return data as Prospect[];
}

export async function getUpcomingTasks() {
  if (!supabase) return [];

  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Get upcoming lease renewals
  const { data: tenants } = await supabase
    .from('tenants')
    .select('*, properties(address)')
    .eq('status', 'active')
    .gte('lease_end', today)
    .lte('lease_end', thirtyDaysFromNow);

  // Get pending maintenance
  const { data: maintenance } = await supabase
    .from('maintenance_records')
    .select('*, properties(address)')
    .in('status', ['pending', 'in_progress'])
    .order('date', { ascending: true })
    .limit(5);

  const tasks: { id: string; task: string; property: string; date: string }[] = [];

  tenants?.forEach(t => {
    tasks.push({
      id: `lease-${t.id}`,
      task: `Lease renewal: ${t.name}`,
      property: (t.properties as any)?.address || 'Unknown',
      date: t.lease_end || '',
    });
  });

  maintenance?.forEach(m => {
    tasks.push({
      id: `maint-${m.id}`,
      task: m.description,
      property: (m.properties as any)?.address || 'Unknown',
      date: m.date,
    });
  });

  return tasks.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

// ============ NEIGHBORS ============

export async function getNeighborsByProperty(propertyId: string) {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('neighbors')
    .select('*')
    .eq('property_id', propertyId)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching neighbors:', error);
    return [];
  }
  return data as Neighbor[];
}

export async function createNeighbor(neighbor: Omit<Neighbor, 'id' | 'created_at'>) {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('neighbors')
    .insert(neighbor)
    .select()
    .single();

  if (error) {
    console.error('Error creating neighbor:', error);
    return null;
  }
  return data as Neighbor;
}

export async function updateNeighbor(id: string, updates: Partial<Neighbor>) {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('neighbors')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating neighbor:', error);
    return null;
  }
  return data as Neighbor;
}

export async function deleteNeighbor(id: string) {
  if (!supabase) return false;

  const { error } = await supabase
    .from('neighbors')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting neighbor:', error);
    return false;
  }
  return true;
}

// ============ PROPERTY CODES ============

export async function getCodesByProperty(propertyId: string) {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('property_codes')
    .select('*')
    .eq('property_id', propertyId)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching property codes:', error);
    return [];
  }
  return data as PropertyCode[];
}

export async function createPropertyCode(code: Omit<PropertyCode, 'id' | 'created_at' | 'updated_at'>) {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('property_codes')
    .insert(code)
    .select()
    .single();

  if (error) {
    console.error('Error creating property code:', error);
    return null;
  }
  return data as PropertyCode;
}

export async function updatePropertyCode(id: string, updates: Partial<PropertyCode>) {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('property_codes')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating property code:', error);
    return null;
  }
  return data as PropertyCode;
}

export async function deletePropertyCode(id: string) {
  if (!supabase) return false;

  const { error } = await supabase
    .from('property_codes')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting property code:', error);
    return false;
  }
  return true;
}

// ============ SERVICE PROVIDERS ============

export async function getServiceProviders() {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('service_providers')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching service providers:', error);
    return [];
  }
  return data as ServiceProvider[];
}

export async function getServiceProvidersByType(type: string) {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('service_providers')
    .select('*')
    .eq('type', type)
    .order('rating', { ascending: false });

  if (error) {
    console.error('Error fetching service providers:', error);
    return [];
  }
  return data as ServiceProvider[];
}

export async function createServiceProvider(provider: Omit<ServiceProvider, 'id' | 'created_at' | 'updated_at'>) {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('service_providers')
    .insert(provider)
    .select()
    .single();

  if (error) {
    console.error('Error creating service provider:', error);
    return null;
  }
  return data as ServiceProvider;
}

export async function updateServiceProvider(id: string, updates: Partial<ServiceProvider>) {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('service_providers')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating service provider:', error);
    return null;
  }
  return data as ServiceProvider;
}

export async function deleteServiceProvider(id: string) {
  if (!supabase) return false;

  const { error } = await supabase
    .from('service_providers')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting service provider:', error);
    return false;
  }
  return true;
}

// ============ BUDGET ENTRIES ============

export async function getBudgetEntriesByProperty(propertyId: string, year?: number) {
  if (!supabase) return [];

  let query = supabase
    .from('budget_entries')
    .select('*')
    .eq('property_id', propertyId)
    .order('category', { ascending: true });

  if (year) {
    query = query.eq('year', year);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching budget entries:', error);
    return [];
  }
  return data as BudgetEntry[];
}

export async function createBudgetEntry(entry: Omit<BudgetEntry, 'id' | 'created_at' | 'updated_at'>) {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('budget_entries')
    .insert(entry)
    .select()
    .single();

  if (error) {
    console.error('Error creating budget entry:', error);
    return null;
  }
  return data as BudgetEntry;
}

export async function updateBudgetEntry(id: string, updates: Partial<BudgetEntry>) {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('budget_entries')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating budget entry:', error);
    return null;
  }
  return data as BudgetEntry;
}

export async function deleteBudgetEntry(id: string) {
  if (!supabase) return false;

  const { error } = await supabase
    .from('budget_entries')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting budget entry:', error);
    return false;
  }
  return true;
}

// ============ BUDGET VS ACTUAL ============

export async function getBudgetVsActual(propertyId: string, year: number) {
  if (!supabase) return { budget: [], actual: [] };

  // Get budget entries for the year
  const { data: budget } = await supabase
    .from('budget_entries')
    .select('*')
    .eq('property_id', propertyId)
    .eq('year', year);

  // Get actual transactions for the year
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;

  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('property_id', propertyId)
    .gte('date', startDate)
    .lte('date', endDate);

  return {
    budget: budget as BudgetEntry[] || [],
    actual: transactions as Transaction[] || [],
  };
}

// ============ PROFORMA SCENARIOS ============

export interface SavedScenario {
  id: string;
  prospect_id: string | null;
  property_id: string | null;
  name: string;
  rental_type: 'ltr' | 'str';
  scenario_data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export async function getScenariosByProspect(prospectId: string) {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('proforma_scenarios')
    .select('*')
    .eq('prospect_id', prospectId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching scenarios:', error);
    return [];
  }
  return data as SavedScenario[];
}

export async function getScenariosByProperty(propertyId: string) {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('proforma_scenarios')
    .select('*')
    .eq('property_id', propertyId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching scenarios:', error);
    return [];
  }
  return data as SavedScenario[];
}

export async function getAllScenarios() {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('proforma_scenarios')
    .select('*, prospects(address, city, state), properties(address, city, state)')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching scenarios:', error);
    return [];
  }
  return data;
}

export async function getScenario(id: string) {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('proforma_scenarios')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching scenario:', error);
    return null;
  }
  return data as SavedScenario;
}

export async function createScenario(scenario: {
  prospect_id?: string | null;
  property_id?: string | null;
  name: string;
  rental_type: 'ltr' | 'str';
  scenario_data: Record<string, unknown>;
}) {
  if (!supabase) return null;

  // For LTR scenarios, extract fields to match existing schema
  // For STR scenarios, store in scenario_data
  const insertData: Record<string, unknown> = {
    prospect_id: scenario.prospect_id || null,
    property_id: scenario.property_id || null,
    name: scenario.name,
    rental_type: scenario.rental_type,
    scenario_data: scenario.scenario_data,
  };

  // For LTR, also populate the legacy columns for backwards compatibility
  if (scenario.rental_type === 'ltr') {
    const data = scenario.scenario_data as Record<string, number>;
    insertData.purchase_price = data.purchase_price || 0;
    insertData.down_payment_pct = data.down_payment_pct || 20;
    insertData.interest_rate = data.interest_rate || 7;
    insertData.loan_term = data.loan_term || 30;
    insertData.closing_costs = data.closing_costs || 0;
    insertData.rehab_budget = data.rehab_budget || 0;
    insertData.monthly_rent = data.monthly_rent || 0;
    insertData.vacancy_rate = data.vacancy_rate || 5;
    insertData.property_mgmt_pct = data.property_mgmt_pct || 0;
    insertData.insurance = data.insurance || 0;
    insertData.taxes = data.taxes || 0;
    insertData.maintenance_reserve_pct = data.maintenance_reserve_pct || 5;
    insertData.hoa = data.hoa || 0;
    insertData.utilities = data.utilities || 0;
    insertData.appreciation_rate = data.appreciation_rate || 3;
    insertData.rent_growth_rate = data.rent_growth_rate || 2;
  } else {
    // STR - set required fields to defaults
    insertData.purchase_price = (scenario.scenario_data as Record<string, number>).purchase_price || 0;
    insertData.monthly_rent = 0; // Not used for STR
  }

  const { data, error } = await supabase
    .from('proforma_scenarios')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error('Error creating scenario:', error);
    throw new Error(error.message);
  }
  return data as SavedScenario;
}

export async function updateScenario(id: string, updates: {
  name?: string;
  rental_type?: 'ltr' | 'str';
  scenario_data?: Record<string, unknown>;
}) {
  if (!supabase) return null;

  const updateData: Record<string, unknown> = { ...updates };

  // For LTR, also update legacy columns
  if (updates.rental_type === 'ltr' && updates.scenario_data) {
    const data = updates.scenario_data as Record<string, number>;
    updateData.purchase_price = data.purchase_price;
    updateData.down_payment_pct = data.down_payment_pct;
    updateData.interest_rate = data.interest_rate;
    updateData.loan_term = data.loan_term;
    updateData.closing_costs = data.closing_costs;
    updateData.rehab_budget = data.rehab_budget;
    updateData.monthly_rent = data.monthly_rent;
    updateData.vacancy_rate = data.vacancy_rate;
    updateData.property_mgmt_pct = data.property_mgmt_pct;
    updateData.insurance = data.insurance;
    updateData.taxes = data.taxes;
    updateData.maintenance_reserve_pct = data.maintenance_reserve_pct;
    updateData.hoa = data.hoa;
    updateData.utilities = data.utilities;
    updateData.appreciation_rate = data.appreciation_rate;
    updateData.rent_growth_rate = data.rent_growth_rate;
  }

  const { data, error } = await supabase
    .from('proforma_scenarios')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating scenario:', error);
    throw new Error(error.message);
  }
  return data as SavedScenario;
}

export async function deleteScenario(id: string) {
  if (!supabase) return false;

  const { error } = await supabase
    .from('proforma_scenarios')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting scenario:', error);
    return false;
  }
  return true;
}
