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
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Database | Supabase (PostgreSQL) |
| Property Data | Zillow API via RapidAPI |
| Charts | Recharts |
| Icons | Lucide React |
| Deployment | Vercel |

---

## Features

### Dashboard (`/`)
- Portfolio overview (total value, equity, cash flow)
- Recent prospects summary
- Upcoming tasks (lease renewals, maintenance)
- Quick action buttons

### Properties (`/properties`)
- List of owned rental properties
- Property detail pages with tabs:
  - Overview (details, mortgage info)
  - Tenants (contact, lease dates, rent)
  - Maintenance (repairs, vendors, costs)
  - Financials (transactions, P&L)
  - Documents (leases, inspections)

### Prospects (`/prospects`)
- Track potential investment properties
- Status workflow: Researching → Offer Made → Won/Lost/Passed
- **Search Properties** (`/prospects/search`):
  - Paste Zillow URL to auto-fetch property data
  - Search by location (city/zip)
  - Search by address
  - Add to prospects with one click

### Proforma Calculator (`/calculator`)
- Full financial modeling for rental analysis
- **Inputs:**
  - Purchase price, down payment %, interest rate, loan term
  - Closing costs, rehab budget
  - Monthly rent, vacancy rate
  - Insurance, taxes, HOA, maintenance reserve
  - Appreciation rate, rent growth rate
- **Calculated Outputs:**
  - Monthly/annual cash flow
  - Cap Rate
  - Cash-on-Cash Return
  - DSCR (Debt Service Coverage Ratio)
  - IRR (Internal Rate of Return)
  - NPV (Net Present Value)
  - 5/10/15/30-year projections with charts

### Banking (`/banking`)
- Transaction list (income/expenses)
- Filter by type, category, date range
- **CSV Import** (`/banking/import`):
  - Upload bank statements from PNC
  - Map columns to categories
  - Review and select transactions to import

---

## Database Schema (Supabase)

### Tables

```
properties          - Owned rental properties
prospects           - Properties being researched
proforma_scenarios  - Financial analysis scenarios
feedback_entries    - Notes/ratings for prospects
tenants             - Tenant information
transactions        - Income and expenses
maintenance_records - Repair/maintenance history
documents           - File storage references
```

### Key Relationships
- `tenants` → `properties` (many-to-one)
- `transactions` → `properties` (many-to-one, nullable)
- `maintenance_records` → `properties` (many-to-one)
- `proforma_scenarios` → `properties` OR `prospects` (one of each)
- `feedback_entries` → `prospects` (many-to-one)
- `documents` → `properties` OR `prospects`

Schema file: `supabase/schema.sql`

---

## API Integrations

### Zillow API (via RapidAPI)
- **Host:** `zillow-com1.p.rapidapi.com`
- **Endpoints used:**
  - `propertyExtendedSearch` - Search by location
  - `propertyByAddress` - Lookup by address
  - `property` - Get details by ZPID
- **Features:**
  - Property details (beds, baths, sqft, year built)
  - List price and Zestimate
  - Rent estimate
  - Days on market
  - Photos

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
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_PiBw3TZrLfISzYGdSyAJ2g_uOglavju

# RapidAPI (Zillow)
RAPIDAPI_KEY=ae953c64c5msh0ed65abfc3d8f62p172b32jsn0ad99aa0c4d6
```

**Note:** These are set in both `.env.local` (local dev) and Vercel (production).

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Dashboard
│   ├── layout.tsx                  # Root layout with sidebar
│   ├── api/mls-search/route.ts     # Zillow API proxy
│   ├── properties/
│   │   ├── page.tsx                # Properties list
│   │   └── [id]/page.tsx           # Property detail
│   ├── prospects/
│   │   ├── page.tsx                # Prospects list
│   │   └── search/page.tsx         # Property search (Zillow)
│   ├── calculator/page.tsx         # Proforma calculator
│   └── banking/
│       ├── page.tsx                # Transactions list
│       └── import/page.tsx         # CSV import
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx             # Navigation sidebar
│   │   └── Header.tsx              # Top header with quick add
│   └── ui/                         # shadcn/ui components
├── lib/
│   ├── supabase.ts                 # Supabase client
│   ├── rapidapi.ts                 # Zillow API functions
│   ├── proforma-calculations.ts    # Financial calc engine
│   └── utils.ts                    # Utility functions
└── types/
    └── index.ts                    # TypeScript types
```

---

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/proforma-calculations.ts` | All financial formulas (mortgage, IRR, NPV, etc.) |
| `src/lib/rapidapi.ts` | Zillow API integration |
| `src/lib/supabase.ts` | Database client |
| `src/types/index.ts` | TypeScript interfaces for all entities |
| `supabase/schema.sql` | Database table definitions |
| `.env.local` | Local environment variables |

---

## Deployment

- **Platform:** Vercel
- **Project ID:** `prj_u1rHb8qf24G3LaKwJ1NSOiuQXOAn`
- **Domain:** murrayaspinwall.com
- **Auto-deploy:** Pending GitHub connection

### Deploy Commands
```bash
# Deploy to Vercel
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

## Current Status

### Completed
- [x] Dashboard with portfolio stats
- [x] Properties list and detail pages
- [x] Prospects list with status tracking
- [x] Zillow property search (URL paste, location, address)
- [x] Proforma calculator with full metrics
- [x] Banking transactions page
- [x] CSV import interface
- [x] Supabase schema created
- [x] Deployed to Vercel
- [x] Custom domain configured

### Pending
- [ ] Connect Supabase to actual pages (currently using demo data)
- [ ] Add prospect to database functionality
- [ ] Property CRUD operations
- [ ] Tenant management
- [ ] Maintenance tracking
- [ ] Document uploads (Supabase Storage)
- [ ] Authentication (Supabase Auth)
- [ ] Connect GitHub to Vercel for auto-deploy

---

## Accounts & Services

| Service | Dashboard |
|---------|-----------|
| Supabase | https://supabase.com/dashboard/project/viaknzbkplndcqqoyupe |
| Vercel | https://vercel.com/omlielabs/rental-property-app |
| RapidAPI | https://rapidapi.com/developer/dashboard |
| GitHub | https://github.com/sobolakjr/MurrayAspinwallLP |
