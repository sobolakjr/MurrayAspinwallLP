'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ChevronDown,
  ChevronRight,
  Home,
  Building2,
  Search,
  Calculator,
  CreditCard,
  FileUp,
  PieChart,
  Wrench,
  HelpCircle,
  MessageSquare,
} from 'lucide-react';

type Section =
  | 'getting-started'
  | 'properties'
  | 'prospects'
  | 'calculator'
  | 'banking'
  | 'import'
  | 'budget'
  | 'resources';

export default function InstructionsPage() {
  const [expandedSection, setExpandedSection] = useState<Section | null>('getting-started');

  const toggleSection = (section: Section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Help & Instructions</h1>
        <p className="text-muted-foreground">
          Learn how to use Murray Aspinwall LP property management system
        </p>
      </div>

      {/* Quick Start Card */}
      <Card className="border-primary/50 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            Quick Start Guide
          </CardTitle>
          <CardDescription>
            Get up and running in just a few steps
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li><strong>Add Properties</strong> - Start by adding your owned rental properties under the Properties section</li>
            <li><strong>Track Prospects</strong> - Use Prospects to research and evaluate potential property purchases</li>
            <li><strong>Run Pro Formas</strong> - Use the Calculator to analyze deals with detailed financial projections</li>
            <li><strong>Import Transactions</strong> - Upload bank statements to track income and expenses</li>
            <li><strong>Set Budgets</strong> - Create annual budgets per property to compare against actual spending</li>
          </ol>
        </CardContent>
      </Card>

      {/* Expandable Sections */}
      <div className="space-y-4">
        {/* Getting Started */}
        <Card>
          <button
            onClick={() => toggleSection('getting-started')}
            className="w-full"
          >
            <CardHeader className="flex flex-row items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <Home className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Getting Started - Dashboard</CardTitle>
              </div>
              {expandedSection === 'getting-started' ? (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              )}
            </CardHeader>
          </button>
          {expandedSection === 'getting-started' && (
            <CardContent className="pt-0">
              <div className="space-y-4 text-sm">
                <p>
                  The <strong>Dashboard</strong> provides an overview of your entire portfolio at a glance:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><strong>Total Properties</strong> - Count of properties you own (excludes sold)</li>
                  <li><strong>Portfolio Value</strong> - Sum of all current property values</li>
                  <li><strong>Total Equity</strong> - Portfolio Value minus outstanding mortgage balances</li>
                  <li><strong>Monthly Cash Flow</strong> - Expected rent income minus mortgage payments</li>
                  <li><strong>Active Prospects</strong> - Properties currently being researched</li>
                </ul>
                <p className="text-muted-foreground">
                  Note: Sold properties are excluded from portfolio value and equity calculations.
                </p>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Properties */}
        <Card>
          <button
            onClick={() => toggleSection('properties')}
            className="w-full"
          >
            <CardHeader className="flex flex-row items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Properties</CardTitle>
              </div>
              {expandedSection === 'properties' ? (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              )}
            </CardHeader>
          </button>
          {expandedSection === 'properties' && (
            <CardContent className="pt-0">
              <div className="space-y-4 text-sm">
                <p>
                  The <strong>Properties</strong> section manages your owned rental properties.
                </p>

                <h4 className="font-semibold">Property Statuses:</h4>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><strong>Rented</strong> - Currently occupied by a tenant</li>
                  <li><strong>Listed (Rent)</strong> - Available for rent, actively marketing</li>
                  <li><strong>Listed (Sell)</strong> - On the market for sale</li>
                  <li><strong>Listed (ST Rental)</strong> - Short-term rental listing</li>
                  <li><strong>Reno/Changeover</strong> - Under renovation or between tenants</li>
                  <li><strong>Sold</strong> - Property has been sold (excluded from portfolio totals)</li>
                </ul>

                <h4 className="font-semibold">Property Details Include:</h4>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Purchase info (price, date, closing costs)</li>
                  <li>Current value and mortgage details</li>
                  <li>Tenant information and lease terms</li>
                  <li>Maintenance records and history</li>
                  <li>Neighbor contacts</li>
                  <li>Access codes (locks, WiFi, alarms)</li>
                </ul>

                <h4 className="font-semibold">Sold Properties:</h4>
                <p>
                  When a property is marked as sold, it displays <strong>Sold Price</strong> and <strong>Profit/Loss</strong>
                  instead of current value and equity. These properties are excluded from portfolio calculations.
                </p>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Prospects */}
        <Card>
          <button
            onClick={() => toggleSection('prospects')}
            className="w-full"
          >
            <CardHeader className="flex flex-row items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <Search className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Prospects</CardTitle>
              </div>
              {expandedSection === 'prospects' ? (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              )}
            </CardHeader>
          </button>
          {expandedSection === 'prospects' && (
            <CardContent className="pt-0">
              <div className="space-y-4 text-sm">
                <p>
                  <strong>Prospects</strong> are properties you're researching for potential purchase.
                </p>

                <h4 className="font-semibold">Prospect Statuses:</h4>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><strong>Researching</strong> - Currently evaluating the property</li>
                  <li><strong>Offer Made</strong> - Submitted an offer, awaiting response</li>
                  <li><strong>Won</strong> - Offer accepted, under contract</li>
                  <li><strong>Lost</strong> - Offer rejected or outbid</li>
                  <li><strong>Passed</strong> - Decided not to pursue</li>
                </ul>

                <h4 className="font-semibold">Features:</h4>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Store MLS numbers and listing URLs</li>
                  <li>Track realtor contact information</li>
                  <li>Record property details (beds, baths, sqft, etc.)</li>
                  <li>Add notes and observations</li>
                  <li>Link to pro forma scenarios for financial analysis</li>
                </ul>

                <p className="text-muted-foreground">
                  Tip: When a prospect is won, you can convert it to a property in your portfolio.
                </p>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Calculator */}
        <Card>
          <button
            onClick={() => toggleSection('calculator')}
            className="w-full"
          >
            <CardHeader className="flex flex-row items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <Calculator className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Pro Forma Calculator</CardTitle>
              </div>
              {expandedSection === 'calculator' ? (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              )}
            </CardHeader>
          </button>
          {expandedSection === 'calculator' && (
            <CardContent className="pt-0">
              <div className="space-y-4 text-sm">
                <p>
                  The <strong>Calculator</strong> runs detailed financial projections for long-term rentals (LTR)
                  and short-term rentals (STR).
                </p>

                <h4 className="font-semibold">Key Metrics Explained:</h4>

                <div className="space-y-3 ml-4">
                  <div>
                    <p className="font-medium">Cap Rate (Capitalization Rate)</p>
                    <p className="text-muted-foreground">
                      Formula: <code className="bg-muted px-1 rounded">NOI / Purchase Price × 100</code>
                    </p>
                    <p className="text-muted-foreground">
                      Measures property income return regardless of financing. Higher = better yield.
                    </p>
                  </div>

                  <div>
                    <p className="font-medium">Cash on Cash Return</p>
                    <p className="text-muted-foreground">
                      Formula: <code className="bg-muted px-1 rounded">Annual Cash Flow / Total Cash Invested × 100</code>
                    </p>
                    <p className="text-muted-foreground">
                      Shows actual return on your out-of-pocket investment.
                    </p>
                  </div>

                  <div>
                    <p className="font-medium">Net Operating Income (NOI)</p>
                    <p className="text-muted-foreground">
                      Formula: <code className="bg-muted px-1 rounded">Gross Income - Vacancy - Operating Expenses</code>
                    </p>
                    <p className="text-muted-foreground">
                      Income before debt service (mortgage payments).
                    </p>
                  </div>

                  <div>
                    <p className="font-medium">DSCR (Debt Service Coverage Ratio)</p>
                    <p className="text-muted-foreground">
                      Formula: <code className="bg-muted px-1 rounded">NOI / Annual Debt Service</code>
                    </p>
                    <p className="text-muted-foreground">
                      Lenders typically want 1.2+ (income covers debt 1.2x).
                    </p>
                  </div>

                  <div>
                    <p className="font-medium">Total Cash Invested</p>
                    <p className="text-muted-foreground">
                      Formula: <code className="bg-muted px-1 rounded">Down Payment + Closing Costs + Rehab Budget</code>
                    </p>
                  </div>

                  <div>
                    <p className="font-medium">Monthly Mortgage Payment</p>
                    <p className="text-muted-foreground">
                      Standard amortization formula based on loan amount, interest rate, and term.
                    </p>
                  </div>
                </div>

                <h4 className="font-semibold mt-4">Short-Term Rental (STR) Mode:</h4>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><strong>Average Nightly Rate</strong> - Expected nightly rental rate</li>
                  <li><strong>Occupancy Rate %</strong> - Percentage of nights booked annually</li>
                  <li><strong>Total Nights/Year</strong> - Occupancy × 365 (syncs with occupancy %)</li>
                  <li><strong>Platform Fees</strong> - Airbnb/VRBO fees (typically 3-15%)</li>
                  <li><strong>Cleaning Cost</strong> - Per-turnover cleaning expense</li>
                  <li><strong>Avg Stay</strong> - Average guest stay length (for turnover calc)</li>
                </ul>

                <h4 className="font-semibold mt-4">Saving Scenarios:</h4>
                <p>
                  Save scenarios to compare different assumptions. Load saved scenarios from the dropdown
                  and update or delete as needed.
                </p>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Banking */}
        <Card>
          <button
            onClick={() => toggleSection('banking')}
            className="w-full"
          >
            <CardHeader className="flex flex-row items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Banking & Transactions</CardTitle>
              </div>
              {expandedSection === 'banking' ? (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              )}
            </CardHeader>
          </button>
          {expandedSection === 'banking' && (
            <CardContent className="pt-0">
              <div className="space-y-4 text-sm">
                <p>
                  The <strong>Banking</strong> section tracks all income and expenses.
                </p>

                <h4 className="font-semibold">Bank Accounts:</h4>
                <p>
                  Add all bank accounts used for property management. Set one as default for new transactions.
                </p>

                <h4 className="font-semibold">Transactions:</h4>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>View all transactions across properties</li>
                  <li>Filter by property, date range, type (income/expense)</li>
                  <li>Categorize transactions for reporting</li>
                  <li>Add manual transactions or import from CSV</li>
                </ul>

                <h4 className="font-semibold">Transaction Categories:</h4>
                <div className="grid grid-cols-2 gap-4 ml-4">
                  <div>
                    <p className="font-medium text-green-600">Income:</p>
                    <ul className="list-disc list-inside text-muted-foreground">
                      <li>Rent</li>
                      <li>Late Fee</li>
                      <li>Pet Fee</li>
                      <li>Application Fee</li>
                      <li>Security Deposit</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium text-red-600">Expenses:</p>
                    <ul className="list-disc list-inside text-muted-foreground">
                      <li>Mortgage</li>
                      <li>Insurance</li>
                      <li>Property Tax</li>
                      <li>Repairs</li>
                      <li>Utilities</li>
                      <li>And more...</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Import */}
        <Card>
          <button
            onClick={() => toggleSection('import')}
            className="w-full"
          >
            <CardHeader className="flex flex-row items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <FileUp className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">CSV Import</CardTitle>
              </div>
              {expandedSection === 'import' ? (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              )}
            </CardHeader>
          </button>
          {expandedSection === 'import' && (
            <CardContent className="pt-0">
              <div className="space-y-4 text-sm">
                <p>
                  Import bank transactions from CSV files exported from your bank.
                </p>

                <h4 className="font-semibold">Import Process:</h4>
                <ol className="list-decimal list-inside space-y-1 ml-4">
                  <li>Download CSV from your bank's website</li>
                  <li>Go to Banking &gt; Import Transactions</li>
                  <li>Select the bank account</li>
                  <li>Upload the CSV file</li>
                  <li>Review and assign properties/categories</li>
                  <li>Select transactions to import</li>
                  <li>Click Import Selected</li>
                </ol>

                <h4 className="font-semibold">Bulk Editing:</h4>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Use checkboxes to select multiple transactions</li>
                  <li>Bulk assign properties, categories, or memos</li>
                  <li>Deselect duplicates (automatically flagged)</li>
                </ul>

                <h4 className="font-semibold">Duplicate Detection:</h4>
                <p>
                  Transactions matching existing records (same date, amount, type) are flagged with
                  an amber "Duplicate" badge and auto-deselected to prevent re-importing.
                </p>

                <p className="text-muted-foreground">
                  Tip: The Import page has detailed instructions for exporting from PNC, Chase,
                  Bank of America, Wells Fargo, and other banks.
                </p>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Budget */}
        <Card>
          <button
            onClick={() => toggleSection('budget')}
            className="w-full"
          >
            <CardHeader className="flex flex-row items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <PieChart className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Budget Tracking</CardTitle>
              </div>
              {expandedSection === 'budget' ? (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              )}
            </CardHeader>
          </button>
          {expandedSection === 'budget' && (
            <CardContent className="pt-0">
              <div className="space-y-4 text-sm">
                <p>
                  Create annual budgets per property and compare against actual spending.
                </p>

                <h4 className="font-semibold">Budget Categories:</h4>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Mortgage</li>
                  <li>Insurance</li>
                  <li>Property Tax</li>
                  <li>HOA</li>
                  <li>Utilities</li>
                  <li>Repairs & Maintenance</li>
                  <li>Property Management</li>
                  <li>Capital Improvements</li>
                  <li>Reserves</li>
                </ul>

                <h4 className="font-semibold">Budget vs Actual:</h4>
                <p>
                  The system compares your budgeted amounts against actual transactions
                  for the selected year, showing variance by category.
                </p>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Resources */}
        <Card>
          <button
            onClick={() => toggleSection('resources')}
            className="w-full"
          >
            <CardHeader className="flex flex-row items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <Wrench className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Resources</CardTitle>
              </div>
              {expandedSection === 'resources' ? (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              )}
            </CardHeader>
          </button>
          {expandedSection === 'resources' && (
            <CardContent className="pt-0">
              <div className="space-y-4 text-sm">
                <h4 className="font-semibold">Documents:</h4>
                <p>
                  Store and organize property documents like leases, inspection reports,
                  insurance policies, and tax records.
                </p>

                <h4 className="font-semibold">Service Providers:</h4>
                <p>
                  Maintain a directory of contractors and service providers:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Plumbers, Electricians, HVAC</li>
                  <li>Landscapers, Cleaners, Roofers</li>
                  <li>General Contractors</li>
                  <li>Attorneys, Accountants, Insurance</li>
                </ul>
                <p>
                  Track contact info, ratings, and total spend per provider.
                </p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Feedback Card */}
      <Card className="border-muted">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Need Help or Have Feedback?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Found a bug or have an idea for improvement? Submit feedback to help us make the app better.
          </p>
          <Button asChild>
            <Link href="/feedback">Submit Feedback</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
