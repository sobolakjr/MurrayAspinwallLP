# Murray Aspinwall LP - Project Context

## Overview
Rental property investment management application for researching, analyzing, and managing rental properties.

**Live URL:** https://murrayaspinwall.com
**GitHub:** https://github.com/sobolakjr/MurrayAspinwallLP
**Vercel Project:** https://vercel.com/omlielabs/rental-property-app

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS 4 + shadcn/ui |
| Database | Supabase (PostgreSQL) |
| Property Data | Rentcast API |
| Charts | Recharts |
| Forms | React Hook Form + Zod |
| Icons | Lucide React |
| Deployment | Vercel |

---

## Features

### Dashboard (`/`)
- Portfolio overview stats:
  - Total properties count
  - Portfolio value
  - Total equity
  - Monthly cash flow
  - Active prospects count
- Recent prospects summary
- Upcoming tasks (lease renewals, pending maintenance)
- Quick action buttons

### Properties (`/properties`)
- List of owned rental properties
- Property status types:
  - **Rented** - Currently occupied
  - **Listed (Rent)** - Listed for rent
  - **Listed (Sell)** - Listed for sale
  - **Reno/Changeover** - Under renovation or between tenants
  - **Listed (STR)** - Listed as short-term rental
- Property detail pages (`/properties/[id]`) with tabs:
  - **Overview** - Details, mortgage info, monthly rent, nightly rent
  - **Tenants** - Contact info, lease dates, rent amount
  - **Maintenance** - Repairs, vendors, costs, status
  - **Financials** - Transactions, P&L
  - **Neighbors** - Neighbor contacts (name, address, phone, email, relationship)
  - **Codes** - Lock codes, passwords, key holders (code type, value, holder info)
  - **Documents** - Leases, inspections, files
- Edit property (`/properties/[id]/edit`)
- Add new property (`/properties/new`)

### Prospects (`/prospects`)
- Track potential investment properties
- Status workflow: Researching → Offer Made → Won/Lost/Passed
- **Search Properties** (`/prospects/search`):
  - Search by address (e.g., "5319 Camelia St, Pittsburgh, PA")
  - Search by location (city/state or zip code)
  - View property details: beds, baths, sqft, year built, last sale price
  - Owner occupied status indicator
  - Add to prospects with one click
- Add prospect manually (`/prospects/new`)

### Proforma Calculator (`/calculator`)
- Full financial modeling for rental analysis
- **LTR/STR Toggle** - Switch between long-term and short-term rental modes
- **LTR (Long-Term Rental) Inputs:**
  - Purchase price, down payment %, interest rate, loan term
  - Closing costs, rehab budget
  - Monthly rent, vacancy rate, property management %
  - Insurance, taxes, HOA, maintenance reserve
  - Appreciation rate, rent growth rate
- **STR (Short-Term Rental) Inputs:**
  - Average daily rate (ADR), occupancy rate
  - Seasonality table (weight or dollar rate by month)
  - Property management %, listing service % (Airbnb/VRBO fees)
  - Cleaning cost per turnover, turnovers per year
  - Capital reserve %
- **Calculated Outputs:**
  - Monthly/annual cash flow
  - Cap Rate
  - Cash-on-Cash Return
  - DSCR (Debt Service Coverage Ratio)
  - IRR (Internal Rate of Return)
  - NPV (Net Present Value)
  - 5/10/15/30-year projections with charts
  - STR-specific: Annual nights booked, annual revenue, effective ADR

### Banking (`/banking`)
- Transaction list (income/expenses)
- Filter by type, category, date range
- **Multiple Bank Accounts:**
  - Add/manage multiple accounts (checking, savings, credit card, investment)
  - Set default account
  - Track balances
  - Assign transactions to accounts
- **Add Transaction** (`/banking/new`):
  - Select type (income/expense)
  - Choose category
  - Assign to property (optional)
  - Select bank account
- **CSV Import** (`/banking/import`):
  - Upload bank statements (supports PNC format)
  - Handles amounts like "- $155,000" or "+ $1,250"
  - Map columns to categories
  - Select bank account for import
  - Review and select transactions to import

### Resources (`/resources`)
- **Documents** (`/resources/documents`):
  - Document management for properties
  - Link documents from Google Drive, Dropbox, or any URL
  - Document types: Lease, Inspection, Insurance, Tax, Deed, Contract, Other
- **Service Providers** (`/resources/providers`):
  - Track trusted contractors and vendors
  - Provider types: Plumbing, Electrical, HVAC, Landscaping, Cleaning, Roofing, General Contractor, Pest Control, Appliance Repair, Locksmith, Attorney, Accountant, Insurance
  - Contact info: Name, phone, email, website, contact person
  - Star rating (1-5)
  - Total spend tracking
  - Notes

### Budget (`/budget`)
- Budget vs Actual comparison by category
- Filter by year and property
- Set annual budget amounts by expense category
- View actual spending from transactions
- Variance analysis (over/under budget)
- Monthly breakdown with expandable categories
- Chart visualization of budget vs actual

### Settings (`/settings`)
- **Profile:** Name, email, company/LLC name
- **Notifications:** Lease expiration reminders, maintenance alerts, payment reminders
- **Default Values:** Vacancy rate, property management fee, maintenance reserve, appreciation rate, rent growth rate, interest rate
- **Data Management:** Export properties, transactions, all data to CSV

---

## Database Schema (Supabase)

### Tables

| Table | Purpose |
|-------|---------|
| `properties` | Owned rental properties |
| `prospects` | Properties being researched |
| `tenants` | Tenant information |
| `transactions` | Income and expenses |
| `bank_accounts` | Bank account management |
| `maintenance_records` | Repair/maintenance history |
| `documents` | File storage references |
| `proforma_scenarios` | Financial analysis scenarios |
| `feedback_entries` | Notes/ratings for prospects |
| `neighbors` | Neighbor contacts for properties |
| `property_codes` | Lock codes, passwords, key holders |
| `service_providers` | Trusted contractors and vendors |
| `budget_entries` | Budget amounts by category/year |

### Key Relationships
- `tenants` → `properties` (many-to-one)
- `transactions` → `properties` (many-to-one, nullable)
- `transactions` → `bank_accounts` (many-to-one, nullable)
- `maintenance_records` → `properties` (many-to-one)
- `proforma_scenarios` → `properties` OR `prospects` (one of each)
- `feedback_entries` → `prospects` (many-to-one)
- `documents` → `properties` OR `prospects`

### Property Status Values
```sql
'own' | 'sold' | 'rented' | 'listed_rent' | 'listed_sell' | 'reno_changeover' | 'listed_str'
```

### Property Fields
- `monthly_rent` - Monthly rent amount for long-term rentals
- `avg_nightly_rent` - Average nightly rate for short-term rentals
- `sold_price` - Sale price if property was sold
- `sold_date` - Date of sale

### Prospect Fields
- `realtor_name` - Listing agent name
- `realtor_phone` - Agent phone number
- `realtor_email` - Agent email
- `realtor_company` - Brokerage/company name
- `listing_urls` - Array of listing URLs (Zillow, Redfin, etc.)

---

## API Integrations

### Rentcast API
- **Base URL:** `https://api.rentcast.io/v1`
- **Authentication:** `X-Api-Key` header
- **Endpoints used:**
  - `GET /properties?address=` - Search by address
  - `GET /properties?city=&state=` - Search by location
  - `GET /properties?zipCode=` - Search by zip code
  - `GET /properties/{id}` - Get property by ID
- **Data returned:**
  - Property details (beds, baths, sqft, year built)
  - Last sale price and date
  - Lot size
  - Owner occupied status
  - Latitude/longitude coordinates

### Supabase
- **URL:** `https://viaknzbkplndcqqoyupe.supabase.co`
- PostgreSQL database
- Real-time subscriptions available
- Row Level Security (RLS) ready but not yet enabled

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://viaknzbkplndcqqoyupe.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Rentcast API (for property search)
RENTCAST_API_KEY=your_rentcast_api_key
```

**Note:** Set in both `.env.local` (local dev) and Vercel (production).

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Dashboard
│   ├── layout.tsx                  # Root layout with sidebar
│   ├── api/mls-search/route.ts     # Rentcast API proxy
│   ├── properties/
│   │   ├── page.tsx                # Properties list
│   │   ├── new/page.tsx            # Add property
│   │   └── [id]/
│   │       ├── page.tsx            # Property detail
│   │       └── edit/page.tsx       # Edit property
│   ├── prospects/
│   │   ├── page.tsx                # Prospects list
│   │   ├── new/page.tsx            # Add prospect manually
│   │   ├── search/page.tsx         # Property search (Rentcast)
│   │   └── actions.ts              # Server actions
│   ├── calculator/page.tsx         # Proforma calculator
│   ├── banking/
│   │   ├── page.tsx                # Transactions list + bank accounts
│   │   ├── new/page.tsx            # Add transaction
│   │   ├── import/page.tsx         # CSV import
│   │   └── actions.ts              # Server actions
│   ├── documents/page.tsx          # Document management
│   └── settings/page.tsx           # User settings
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx             # Navigation sidebar
│   │   └── Header.tsx              # Top header
│   └── ui/                         # shadcn/ui components
├── lib/
│   ├── supabase.ts                 # Supabase client
│   ├── database.ts                 # Database functions (CRUD)
│   ├── rentcast.ts                 # Rentcast API integration
│   ├── proforma-calculations.ts    # Financial calc engine
│   └── utils.ts                    # Utility functions
└── types/
    └── index.ts                    # TypeScript interfaces
```

---

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/database.ts` | All Supabase CRUD operations |
| `src/lib/rentcast.ts` | Rentcast API integration |
| `src/lib/proforma-calculations.ts` | Financial formulas (mortgage, IRR, NPV, etc.) |
| `src/types/index.ts` | TypeScript interfaces for all entities |
| `supabase/schema.sql` | Database table definitions |

---

## TypeScript Types

### Core Entities
- `Property` - Owned property with mortgage, rent, status
- `Prospect` - Potential investment property
- `Tenant` - Tenant info with lease dates
- `Transaction` - Income/expense record
- `BankAccount` - Bank account for transactions
- `MaintenanceRecord` - Repair/maintenance entry
- `Document` - File reference
- `ProformaScenario` - Financial analysis inputs
- `FeedbackEntry` - Notes/ratings for prospects
- `Neighbor` - Neighbor contact for a property
- `PropertyCode` - Lock codes, passwords, key holders
- `ServiceProvider` - Trusted contractor or vendor
- `BudgetEntry` - Annual/monthly budget by category

### Enums
- `PropertyStatus`: own, sold, rented, listed_rent, listed_sell, reno_changeover, listed_str
- `ProspectStatus`: researching, offer_made, passed, won, lost
- `ServiceProviderType`: plumbing, electrical, hvac, landscaping, cleaning, roofing, general_contractor, pest_control, appliance_repair, locksmith, attorney, accountant, insurance, other
- `TenantStatus`: active, past, pending
- `TransactionType`: income, expense
- `BankAccountType`: checking, savings, credit_card, investment, other
- `MaintenanceStatus`: pending, in_progress, completed

### Transaction Categories
**Income:** Rent, Late Fee, Pet Fee, Application Fee, Security Deposit, Other Income
**Expense:** Mortgage, Insurance, Property Tax, HOA, Utilities, Repairs, Maintenance, Property Management, Landscaping, Pest Control, Legal, Advertising, Supplies, Travel, Other Expense

---

## Deployment

- **Platform:** Vercel
- **Domain:** murrayaspinwall.com
- **Auto-deploy:** Connected to GitHub main branch

### Deploy Commands
```bash
# Deploy to Vercel (preview)
npx vercel --yes

# Deploy to production
npx vercel --prod --yes
```

---

## Local Development

```bash
# Start dev server
cd ~/Projects/rental-property-app
npm run dev

# Build for production
npm run build

# Run production build locally
npm start
```

**Local URL:** http://localhost:3000

---

## Recent Changes (Development History)

### January 2025

#### Rentcast API Migration
- Replaced RapidAPI/Zillow integration with Rentcast API
- Removed Zillow URL paste feature (no longer needed)
- Search now by address or location only
- Shows last sale price instead of Zestimate
- Added owner occupied status indicator
- Files changed: `src/lib/rentcast.ts` (new), `src/app/api/mls-search/route.ts`, `src/app/prospects/search/page.tsx`

#### Multiple Bank Accounts
- Added bank account management to Banking page
- Support for: checking, savings, credit card, investment accounts
- Set default account for new transactions
- Assign transactions to specific accounts
- CSV import with account selection
- New database table: `bank_accounts`
- New field on transactions: `bank_account_id`

#### Property Status Updates
- Changed status options from active/pending/sold to:
  - Rented, Listed (Rent), Listed (Sell), Reno/Changeover, Listed (STR)
- Added fields: `monthly_rent`, `avg_nightly_rent`

#### PNC CSV Import Fix
- Fixed amount parsing for PNC bank exports
- Handles formats like "- $155,000" and "+ $1,250"

#### Settings Page
- Created `/settings` page with profile, notifications, defaults sections

---

## Database SQL (Recent Additions)

```sql
-- Bank accounts table
CREATE TABLE bank_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  institution TEXT,
  account_type TEXT DEFAULT 'checking',
  account_number_last4 TEXT,
  current_balance NUMERIC,
  is_default BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add bank_account_id to transactions
ALTER TABLE transactions ADD COLUMN bank_account_id UUID REFERENCES bank_accounts(id);

-- Add rent fields to properties
ALTER TABLE properties ADD COLUMN monthly_rent NUMERIC;
ALTER TABLE properties ADD COLUMN avg_nightly_rent NUMERIC;

-- Update property status enum
ALTER TABLE properties
ALTER COLUMN status TYPE TEXT;
-- Valid values: 'rented', 'listed_rent', 'listed_sell', 'reno_changeover', 'listed_str'
```

---

## Accounts & Services

| Service | Dashboard |
|---------|-----------|
| Supabase | https://supabase.com/dashboard/project/viaknzbkplndcqqoyupe |
| Vercel | https://vercel.com/omlielabs/rental-property-app |
| Rentcast | https://rentcast.io/dashboard |
| GitHub | https://github.com/sobolakjr/MurrayAspinwallLP |

---

## Current Status

### Completed
- [x] Dashboard with portfolio stats
- [x] Properties list and detail pages with tabs
- [x] Property CRUD operations
- [x] Multiple property status types (own/sold/rented/etc.)
- [x] Prospects list with status tracking
- [x] Realtor contact info on prospects
- [x] Rentcast property search (address, location)
- [x] Proforma calculator with LTR/STR toggle
- [x] STR seasonality table with weight/rate modes
- [x] Banking transactions page
- [x] Multiple bank account management
- [x] CSV import (PNC format supported)
- [x] Budget vs Actual page
- [x] Service Providers management
- [x] Settings page
- [x] Neighbors section for properties
- [x] Codes/passwords/keys section for properties
- [x] API request approval popup (cost management)
- [x] Authentication (Supabase Auth) with login/signup pages
- [x] User menu with sign out
- [x] Protected routes (middleware)
- [x] Supabase database connected
- [x] Deployed to Vercel with custom domain

### Pending
- [x] Create two user accounts (owner + partner) with passwords in Supabase Auth
  - Dave Sobolak: dave@omlie.com
  - Matt Nee: mdnee@uss.com
- [ ] User roles and permissions (admin/viewer)
- [ ] Tenant management UI improvements
- [ ] Document uploads (Supabase Storage)
- [ ] Reports page enhancements
- [ ] Mobile responsive improvements
- [ ] Email notifications

---

## Session Notes (January 2026)

### Latest Session Summary
This session added several major features:

1. **Authentication (Supabase Auth)**
   - Login/signup pages at `/login` and `/signup`
   - Middleware protects all routes (redirects to login if not authenticated)
   - Auth callback at `/auth/callback` for email confirmation
   - User menu in header with sign out
   - Files: `src/lib/supabase/client.ts`, `server.ts`, `middleware.ts`, `src/middleware.ts`
   - To enable: Configure Supabase Auth in dashboard, add redirect URLs

2. **Neighbors & Codes Tabs** (Property Detail)
   - Full CRUD for neighbor contacts (name, address, phone, email, relationship)
   - Full CRUD for codes/keys (lock codes, passwords, key holders)
   - Server actions in `src/app/properties/actions.ts`

3. **API Request Approval Popup**
   - Confirmation dialog before Rentcast API calls
   - Component: `src/components/api-confirm-dialog.tsx`
   - Used on property search and prospect detail refresh

4. **Sold Status for Properties**
   - Added "Own" and "Sold" to status dropdown
   - Sold properties show sold_price, sold_date, profit/loss
   - Amber styling for sold badge and info card

5. **Rent Income Fix**
   - Dashboard and property detail now use tenant rent_amount or property monthly_rent
   - Previously only looked at transactions (which showed $0)

### Key Files Changed This Session
- `src/app/properties/[id]/property-detail-client.tsx` - Neighbors, Codes tabs, sold display
- `src/app/properties/[id]/edit/property-edit-client.tsx` - Sold status fields
- `src/app/properties/actions.ts` - Neighbor/code CRUD actions
- `src/lib/database.ts` - Updated getDashboardStats for rent income
- `src/components/layout/Header.tsx` - User menu with auth
- `src/app/layout.tsx` - AuthProvider wrapper

### How to Resume
When starting a new session, tell Claude:
> "Read CONTEXT.md to understand the project, then [your task]"

Or simply work in this directory - Claude will read CONTEXT.md automatically when needed.
