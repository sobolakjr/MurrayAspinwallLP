-- Migration 002: Add new features
-- Run this in Supabase SQL Editor

-- Step 1: Update property status constraint to include 'own' and 'sold'
ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_status_check;
ALTER TABLE properties ADD CONSTRAINT properties_status_check
  CHECK (status IN ('own', 'sold', 'rented', 'listed_rent', 'listed_sell', 'reno_changeover', 'listed_str'));

-- Step 2: Add sold property fields
ALTER TABLE properties ADD COLUMN IF NOT EXISTS sold_price DECIMAL(12,2);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS sold_date DATE;

-- Step 3: Add realtor info to prospects
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS realtor_name TEXT;
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS realtor_phone TEXT;
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS realtor_email TEXT;
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS realtor_company TEXT;

-- Step 4: Create neighbors table
CREATE TABLE IF NOT EXISTS neighbors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  relationship TEXT, -- 'left', 'right', 'across', 'behind', etc.
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_neighbors_property ON neighbors(property_id);

-- Step 5: Create property_codes table (passwords, lock codes, key holders)
CREATE TABLE IF NOT EXISTS property_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g., 'Front door', 'Garage', 'WiFi', 'Alarm'
  code_type TEXT DEFAULT 'lock_code' CHECK (code_type IN ('lock_code', 'password', 'key_holder', 'gate_code', 'other')),
  value TEXT, -- The actual code/password (consider encryption for production)
  holder_name TEXT, -- Who has a key
  holder_phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_property_codes_property ON property_codes(property_id);

-- Step 6: Create service_providers table
CREATE TABLE IF NOT EXISTS service_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('plumbing', 'electrical', 'hvac', 'landscaping', 'cleaning', 'roofing', 'general_contractor', 'pest_control', 'appliance_repair', 'locksmith', 'attorney', 'accountant', 'insurance', 'other')),
  phone TEXT,
  email TEXT,
  website TEXT,
  contact_name TEXT,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  total_spend DECIMAL(12,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 7: Create budget_entries table
CREATE TABLE IF NOT EXISTS budget_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  category TEXT NOT NULL,
  annual_amount DECIMAL(12,2),
  monthly_amounts DECIMAL(12,2)[], -- Array of 12 monthly values
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(property_id, year, category)
);

CREATE INDEX IF NOT EXISTS idx_budget_entries_property ON budget_entries(property_id);
CREATE INDEX IF NOT EXISTS idx_budget_entries_year ON budget_entries(year);

-- Step 8: Apply updated_at triggers to new tables
CREATE TRIGGER property_codes_updated_at
  BEFORE UPDATE ON property_codes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER service_providers_updated_at
  BEFORE UPDATE ON service_providers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER budget_entries_updated_at
  BEFORE UPDATE ON budget_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Step 9: Update existing 'rented' status to 'own' if they have no sold info
-- (Optional: run only if you want to migrate existing data)
-- UPDATE properties SET status = 'own' WHERE status = 'rented' AND sold_date IS NULL;
