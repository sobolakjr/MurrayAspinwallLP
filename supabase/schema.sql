-- Rental Property Investment Manager Database Schema

-- Properties (current inventory)
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip TEXT NOT NULL,
  purchase_price DECIMAL(12,2),
  purchase_date DATE,
  current_value DECIMAL(12,2),
  mortgage_balance DECIMAL(12,2),
  mortgage_rate DECIMAL(5,3),
  mortgage_payment DECIMAL(10,2),
  property_type TEXT CHECK (property_type IN ('single_family', 'multi_family', 'condo', 'townhouse', 'duplex', 'triplex', 'fourplex')),
  bedrooms INTEGER,
  bathrooms DECIMAL(3,1),
  sqft INTEGER,
  lot_size DECIMAL(10,2),
  year_built INTEGER,
  status TEXT DEFAULT 'rented' CHECK (status IN ('rented', 'listed_rent', 'listed_sell', 'reno_changeover', 'listed_str')),
  monthly_rent DECIMAL(10,2),
  avg_nightly_rent DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prospects (properties being researched)
CREATE TABLE prospects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mls_number TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip TEXT NOT NULL,
  list_price DECIMAL(12,2),
  property_type TEXT CHECK (property_type IN ('single_family', 'multi_family', 'condo', 'townhouse', 'duplex', 'triplex', 'fourplex')),
  bedrooms INTEGER,
  bathrooms DECIMAL(3,1),
  sqft INTEGER,
  lot_size DECIMAL(10,2),
  year_built INTEGER,
  days_on_market INTEGER,
  status TEXT DEFAULT 'researching' CHECK (status IN ('researching', 'offer_made', 'passed', 'won', 'lost')),
  api_data JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Proforma scenarios
CREATE TABLE proforma_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id UUID REFERENCES prospects(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  -- Purchase assumptions
  purchase_price DECIMAL(12,2) NOT NULL,
  down_payment_pct DECIMAL(5,2) DEFAULT 20,
  interest_rate DECIMAL(5,3) DEFAULT 7.0,
  loan_term INTEGER DEFAULT 30,
  closing_costs DECIMAL(10,2) DEFAULT 0,
  rehab_budget DECIMAL(10,2) DEFAULT 0,
  -- Income assumptions
  monthly_rent DECIMAL(10,2) NOT NULL,
  vacancy_rate DECIMAL(5,2) DEFAULT 5,
  -- Expense assumptions
  property_mgmt_pct DECIMAL(5,2) DEFAULT 0,
  insurance DECIMAL(10,2) DEFAULT 0,
  taxes DECIMAL(10,2) DEFAULT 0,
  maintenance_reserve_pct DECIMAL(5,2) DEFAULT 5,
  hoa DECIMAL(10,2) DEFAULT 0,
  utilities DECIMAL(10,2) DEFAULT 0,
  -- Growth assumptions
  appreciation_rate DECIMAL(5,2) DEFAULT 3,
  rent_growth_rate DECIMAL(5,2) DEFAULT 2,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Either prospect_id or property_id must be set
  CONSTRAINT scenario_property_check CHECK (
    (prospect_id IS NOT NULL AND property_id IS NULL) OR
    (prospect_id IS NULL AND property_id IS NOT NULL)
  )
);

-- Feedback entries for prospects
CREATE TABLE feedback_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id UUID NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
  visit_date DATE NOT NULL,
  overall_rating INTEGER CHECK (overall_rating BETWEEN 1 AND 5),
  -- Checklist responses stored as JSON
  checklist_responses JSONB DEFAULT '{}'::jsonb,
  notes TEXT,
  pros TEXT[],
  cons TEXT[],
  photos TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tenants
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  lease_start DATE,
  lease_end DATE,
  rent_amount DECIMAL(10,2),
  security_deposit DECIMAL(10,2),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'past', 'pending')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bank Accounts
CREATE TABLE bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  institution TEXT,
  account_type TEXT DEFAULT 'checking' CHECK (account_type IN ('checking', 'savings', 'credit_card', 'investment', 'other')),
  account_number_last4 TEXT,
  current_balance DECIMAL(12,2),
  is_default BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions (income and expenses)
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  bank_account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category TEXT NOT NULL,
  description TEXT,
  vendor TEXT,
  imported_from TEXT DEFAULT 'manual' CHECK (imported_from IN ('manual', 'csv', 'plaid')),
  external_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Maintenance records
CREATE TABLE maintenance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  cost DECIMAL(10,2),
  vendor TEXT,
  category TEXT CHECK (category IN ('plumbing', 'electrical', 'hvac', 'appliance', 'structural', 'cosmetic', 'landscaping', 'other')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  prospect_id UUID REFERENCES prospects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('lease', 'inspection', 'insurance', 'tax', 'deed', 'contract', 'other')),
  file_url TEXT NOT NULL,
  file_size INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT document_property_check CHECK (
    (property_id IS NOT NULL) OR (prospect_id IS NOT NULL)
  )
);

-- Indexes for common queries
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_prospects_status ON prospects(status);
CREATE INDEX idx_prospects_mls ON prospects(mls_number);
CREATE INDEX idx_transactions_property ON transactions(property_id);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_category ON transactions(category);
CREATE INDEX idx_tenants_property ON tenants(property_id);
CREATE INDEX idx_maintenance_property ON maintenance_records(property_id);
CREATE INDEX idx_proforma_prospect ON proforma_scenarios(prospect_id);
CREATE INDEX idx_proforma_property ON proforma_scenarios(property_id);

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER properties_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER prospects_updated_at
  BEFORE UPDATE ON prospects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER proforma_scenarios_updated_at
  BEFORE UPDATE ON proforma_scenarios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER maintenance_records_updated_at
  BEFORE UPDATE ON maintenance_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER bank_accounts_updated_at
  BEFORE UPDATE ON bank_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Row Level Security (enable when needed)
-- ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE prospects ENABLE ROW LEVEL SECURITY;
-- etc.
