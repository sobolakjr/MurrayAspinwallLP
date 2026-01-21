'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft,
  Building2,
  Edit,
  DollarSign,
  Users,
  Wrench,
  FileText,
  TrendingUp,
  Calendar,
  Home,
  Plus,
} from 'lucide-react';
import type { Property, Tenant, MaintenanceRecord, Transaction } from '@/types';

// Demo data
const demoProperty: Property = {
  id: '1',
  address: '789 Elm Street',
  city: 'Columbus',
  state: 'OH',
  zip: '43215',
  purchase_price: 285000,
  purchase_date: '2022-06-15',
  current_value: 325000,
  mortgage_balance: 228000,
  mortgage_rate: 6.5,
  mortgage_payment: 1445,
  property_type: 'single_family',
  bedrooms: 3,
  bathrooms: 2,
  sqft: 1650,
  lot_size: 0.25,
  year_built: 1985,
  status: 'active',
  notes: 'Great starter investment property in established neighborhood.',
  created_at: '2022-06-15T00:00:00Z',
  updated_at: '2024-01-15T00:00:00Z',
};

const demoTenants: Tenant[] = [
  {
    id: '1',
    property_id: '1',
    name: 'John Smith',
    email: 'john.smith@email.com',
    phone: '614-555-1234',
    lease_start: '2023-08-01',
    lease_end: '2024-07-31',
    rent_amount: 1850,
    security_deposit: 1850,
    status: 'active',
    notes: 'Reliable tenant, always pays on time.',
    created_at: '2023-08-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

const demoMaintenance: MaintenanceRecord[] = [
  {
    id: '1',
    property_id: '1',
    date: '2024-01-10',
    description: 'HVAC filter replacement and inspection',
    cost: 150,
    vendor: 'ABC Heating & Cooling',
    category: 'hvac',
    status: 'completed',
    notes: null,
    created_at: '2024-01-10T00:00:00Z',
    updated_at: '2024-01-10T00:00:00Z',
  },
  {
    id: '2',
    property_id: '1',
    date: '2024-02-15',
    description: 'Annual furnace maintenance',
    cost: 200,
    vendor: 'ABC Heating & Cooling',
    category: 'hvac',
    status: 'pending',
    notes: 'Scheduled for February',
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
  },
];

const demoTransactions: Transaction[] = [
  {
    id: '1',
    property_id: '1',
    date: '2024-01-01',
    amount: 1850,
    type: 'income',
    category: 'Rent',
    description: 'January rent payment',
    vendor: null,
    imported_from: 'manual',
    external_id: null,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    property_id: '1',
    date: '2024-01-01',
    amount: 1445,
    type: 'expense',
    category: 'Mortgage',
    description: 'January mortgage payment',
    vendor: 'PNC Bank',
    imported_from: 'manual',
    external_id: null,
    created_at: '2024-01-01T00:00:00Z',
  },
];

export default function PropertyDetailPage() {
  const params = useParams();
  const property = demoProperty; // Replace with Supabase query
  const tenants = demoTenants;
  const maintenance = demoMaintenance;
  const transactions = demoTransactions;

  const equity = (property.current_value || 0) - (property.mortgage_balance || 0);
  const monthlyIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const monthlyExpenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  const cashFlow = monthlyIncome - monthlyExpenses;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/properties">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">{property.address}</h1>
              <Badge variant={property.status === 'active' ? 'default' : 'secondary'}>
                {property.status}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {property.city}, {property.state} {property.zip}
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href={`/properties/${property.id}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Property
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Value</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(property.current_value || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Purchased at ${(property.purchase_price || 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Equity</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${equity.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {((equity / (property.current_value || 1)) * 100).toFixed(1)}% of value
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Cash Flow</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${cashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {cashFlow >= 0 ? '+' : ''}${cashFlow.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              ${monthlyIncome.toLocaleString()} income - ${monthlyExpenses.toLocaleString()} expenses
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tenants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tenants.filter((t) => t.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">
              ${tenants.reduce((sum, t) => sum + (t.rent_amount || 0), 0).toLocaleString()}/mo rent
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tenants">Tenants</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="financials">Financials</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Property Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Property Type</p>
                    <p className="font-medium capitalize">{property.property_type?.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Year Built</p>
                    <p className="font-medium">{property.year_built}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Bedrooms</p>
                    <p className="font-medium">{property.bedrooms}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Bathrooms</p>
                    <p className="font-medium">{property.bathrooms}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Square Feet</p>
                    <p className="font-medium">{property.sqft?.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Lot Size</p>
                    <p className="font-medium">{property.lot_size} acres</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Mortgage Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Purchase Price</p>
                    <p className="font-medium">${(property.purchase_price || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Purchase Date</p>
                    <p className="font-medium">{property.purchase_date ? new Date(property.purchase_date).toLocaleDateString() : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Mortgage Balance</p>
                    <p className="font-medium">${(property.mortgage_balance || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Interest Rate</p>
                    <p className="font-medium">{property.mortgage_rate}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Monthly Payment</p>
                    <p className="font-medium">${(property.mortgage_payment || 0).toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {property.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{property.notes}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="tenants" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Tenants</CardTitle>
                <CardDescription>Current and past tenants</CardDescription>
              </div>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Tenant
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Lease Period</TableHead>
                    <TableHead className="text-right">Rent</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tenants.map((tenant) => (
                    <TableRow key={tenant.id}>
                      <TableCell className="font-medium">{tenant.name}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{tenant.email}</div>
                          <div className="text-muted-foreground">{tenant.phone}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {tenant.lease_start && tenant.lease_end
                          ? `${new Date(tenant.lease_start).toLocaleDateString()} - ${new Date(tenant.lease_end).toLocaleDateString()}`
                          : 'N/A'}
                      </TableCell>
                      <TableCell className="text-right">
                        ${(tenant.rent_amount || 0).toLocaleString()}/mo
                      </TableCell>
                      <TableCell>
                        <Badge variant={tenant.status === 'active' ? 'default' : 'secondary'}>
                          {tenant.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Maintenance Records</CardTitle>
                <CardDescription>Track repairs and scheduled maintenance</CardDescription>
              </div>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Record
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {maintenance.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                      <TableCell className="font-medium">{record.description}</TableCell>
                      <TableCell className="capitalize">{record.category}</TableCell>
                      <TableCell>{record.vendor}</TableCell>
                      <TableCell className="text-right">
                        ${(record.cost || 0).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            record.status === 'completed'
                              ? 'default'
                              : record.status === 'in_progress'
                              ? 'secondary'
                              : 'outline'
                          }
                        >
                          {record.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financials" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Income and expenses for this property</CardDescription>
              </div>
              <Button size="sm" asChild>
                <Link href="/banking">
                  View All Transactions
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell>{new Date(tx.date).toLocaleDateString()}</TableCell>
                      <TableCell className="font-medium">{tx.description}</TableCell>
                      <TableCell>{tx.category}</TableCell>
                      <TableCell
                        className={`text-right font-medium ${
                          tx.type === 'income' ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {tx.type === 'income' ? '+' : '-'}${tx.amount.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Documents</CardTitle>
                <CardDescription>Leases, inspections, and other files</CardDescription>
              </div>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Upload Document
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-medium">No documents yet</h3>
                <p className="text-sm text-muted-foreground">
                  Upload leases, inspections, and other important documents
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
