-- Migration to update property status values to new enum
-- Run this in Supabase SQL Editor

-- Step 1: Drop the existing check constraint
ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_status_check;

-- Step 2: Add the new columns if they don't exist
ALTER TABLE properties ADD COLUMN IF NOT EXISTS monthly_rent DECIMAL(10,2);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS avg_nightly_rent DECIMAL(10,2);

-- Step 3: Update existing status values to the new format
-- Map 'active' to 'rented', 'sold' stays as is (will be removed from new enum), 'pending' to 'reno_changeover'
UPDATE properties SET status = 'rented' WHERE status = 'active';
UPDATE properties SET status = 'reno_changeover' WHERE status = 'pending';
-- For 'sold' properties, you may want to delete them or change status
UPDATE properties SET status = 'rented' WHERE status = 'sold';

-- Step 4: Add the new check constraint with the correct status values
ALTER TABLE properties ADD CONSTRAINT properties_status_check
  CHECK (status IN ('rented', 'listed_rent', 'listed_sell', 'reno_changeover', 'listed_str'));

-- Step 5: Create bank_accounts table if it doesn't exist
CREATE TABLE IF NOT EXISTS bank_accounts (
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

-- Step 6: Add bank_account_id to transactions if it doesn't exist
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS bank_account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL;

-- Step 7: Create trigger for bank_accounts if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS bank_accounts_updated_at ON bank_accounts;
CREATE TRIGGER bank_accounts_updated_at
  BEFORE UPDATE ON bank_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Step 8: Add listing_urls to prospects table
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS listing_urls TEXT[];
