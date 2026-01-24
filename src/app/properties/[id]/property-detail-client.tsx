'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  FileText,
  TrendingUp,
  Plus,
  MapPin,
  Key,
  Trash2,
  Phone,
  Mail,
} from 'lucide-react';
import type { Property, Tenant, MaintenanceRecord, Transaction, Neighbor, PropertyCode } from '@/types';
import {
  createNeighborAction,
  updateNeighborAction,
  deleteNeighborAction,
  createPropertyCodeAction,
  updatePropertyCodeAction,
  deletePropertyCodeAction,
} from '../actions';

interface PropertyDetailClientProps {
  property: Property;
  tenants: Tenant[];
  maintenance: MaintenanceRecord[];
  transactions: Transaction[];
  neighbors: Neighbor[];
  codes: PropertyCode[];
}

function formatStatus(status: string): string {
  const statusLabels: Record<string, string> = {
    own: 'Own',
    rented: 'Rented',
    listed_rent: 'Listed (Rent)',
    listed_sell: 'Listed (Sell)',
    reno_changeover: 'Reno/Changeover',
    listed_str: 'Listed (ST Rental)',
    sold: 'Sold',
  };
  return statusLabels[status] || status;
}

export function PropertyDetailClient({
  property,
  tenants,
  maintenance,
  transactions,
  neighbors: initialNeighbors,
  codes: initialCodes,
}: PropertyDetailClientProps) {
  const equity = (Number(property.current_value) || 0) - (Number(property.mortgage_balance) || 0);

  // Calculate expected monthly rent income from active tenants
  const activeTenants = tenants.filter((t) => t.status === 'active');
  const tenantRentIncome = activeTenants.reduce((sum, t) => sum + (Number(t.rent_amount) || 0), 0);

  // Fall back to property monthly_rent if no active tenants with rent
  const monthlyRentIncome = tenantRentIncome > 0
    ? tenantRentIncome
    : (Number(property.monthly_rent) || 0);

  // Monthly expenses = mortgage payment (could add other recurring expenses later)
  const monthlyMortgage = Number(property.mortgage_payment) || 0;

  // Cash flow = rent income - mortgage
  const cashFlow = monthlyRentIncome - monthlyMortgage;

  // Neighbors state
  const [neighbors, setNeighbors] = useState<Neighbor[]>(initialNeighbors);
  const [neighborDialogOpen, setNeighborDialogOpen] = useState(false);
  const [editingNeighbor, setEditingNeighbor] = useState<Neighbor | null>(null);
  const [neighborForm, setNeighborForm] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    relationship: '',
    notes: '',
  });
  const [neighborSaving, setNeighborSaving] = useState(false);

  // Codes state
  const [codes, setCodes] = useState<PropertyCode[]>(initialCodes);
  const [codeDialogOpen, setCodeDialogOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<PropertyCode | null>(null);
  const [codeForm, setCodeForm] = useState({
    name: '',
    code_type: 'lock_code' as PropertyCode['code_type'],
    value: '',
    holder_name: '',
    holder_phone: '',
    notes: '',
  });
  const [codeSaving, setCodeSaving] = useState(false);

  // Neighbor handlers
  const openNeighborDialog = (neighbor?: Neighbor) => {
    if (neighbor) {
      setEditingNeighbor(neighbor);
      setNeighborForm({
        name: neighbor.name || '',
        address: neighbor.address || '',
        phone: neighbor.phone || '',
        email: neighbor.email || '',
        relationship: neighbor.relationship || '',
        notes: neighbor.notes || '',
      });
    } else {
      setEditingNeighbor(null);
      setNeighborForm({
        name: '',
        address: '',
        phone: '',
        email: '',
        relationship: '',
        notes: '',
      });
    }
    setNeighborDialogOpen(true);
  };

  const handleSaveNeighbor = async () => {
    if (!neighborForm.name) return;
    setNeighborSaving(true);

    try {
      if (editingNeighbor) {
        const result = await updateNeighborAction(editingNeighbor.id, neighborForm);
        if (result.success && result.neighbor) {
          setNeighbors(neighbors.map((n) => (n.id === editingNeighbor.id ? result.neighbor! : n)));
        }
      } else {
        const result = await createNeighborAction({
          property_id: property.id,
          ...neighborForm,
        });
        if (result.success && result.neighbor) {
          setNeighbors([...neighbors, result.neighbor]);
        }
      }
      setNeighborDialogOpen(false);
    } catch (error) {
      console.error('Error saving neighbor:', error);
    } finally {
      setNeighborSaving(false);
    }
  };

  const handleDeleteNeighbor = async (id: string) => {
    if (!confirm('Are you sure you want to delete this neighbor?')) return;

    const result = await deleteNeighborAction(id);
    if (result.success) {
      setNeighbors(neighbors.filter((n) => n.id !== id));
    }
  };

  // Code handlers
  const openCodeDialog = (code?: PropertyCode) => {
    if (code) {
      setEditingCode(code);
      setCodeForm({
        name: code.name || '',
        code_type: code.code_type || 'lock_code',
        value: code.value || '',
        holder_name: code.holder_name || '',
        holder_phone: code.holder_phone || '',
        notes: code.notes || '',
      });
    } else {
      setEditingCode(null);
      setCodeForm({
        name: '',
        code_type: 'lock_code',
        value: '',
        holder_name: '',
        holder_phone: '',
        notes: '',
      });
    }
    setCodeDialogOpen(true);
  };

  const handleSaveCode = async () => {
    if (!codeForm.name) return;
    setCodeSaving(true);

    try {
      if (editingCode) {
        const result = await updatePropertyCodeAction(editingCode.id, codeForm);
        if (result.success && result.code) {
          setCodes(codes.map((c) => (c.id === editingCode.id ? result.code! : c)));
        }
      } else {
        const result = await createPropertyCodeAction({
          property_id: property.id,
          ...codeForm,
        });
        if (result.success && result.code) {
          setCodes([...codes, result.code]);
        }
      }
      setCodeDialogOpen(false);
    } catch (error) {
      console.error('Error saving code:', error);
    } finally {
      setCodeSaving(false);
    }
  };

  const handleDeleteCode = async (id: string) => {
    if (!confirm('Are you sure you want to delete this code?')) return;

    const result = await deletePropertyCodeAction(id);
    if (result.success) {
      setCodes(codes.filter((c) => c.id !== id));
    }
  };

  const codeTypeLabels: Record<string, string> = {
    lock_code: 'Lock Code',
    password: 'Password',
    key_holder: 'Key Holder',
    gate_code: 'Gate Code',
    other: 'Other',
  };

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
              <Badge
                variant={property.status === 'sold' ? 'outline' : property.status === 'rented' ? 'default' : 'secondary'}
                className={property.status === 'sold' ? 'border-amber-500 text-amber-700 bg-amber-50' : ''}
              >
                {formatStatus(property.status)}
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
      {property.status === 'sold' ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sold Price</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${(Number(property.sold_price) || 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {property.sold_date ? `Sold on ${new Date(property.sold_date).toLocaleDateString()}` : 'Sale date not recorded'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Profit/Loss</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {(() => {
                const profitLoss = (Number(property.sold_price) || 0) - (Number(property.purchase_price) || 0);
                return (
                  <>
                    <div className={`text-2xl font-bold ${profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {profitLoss >= 0 ? '+' : ''}${profitLoss.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Purchased at ${(Number(property.purchase_price) || 0).toLocaleString()}
                    </p>
                  </>
                );
              })()}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Value</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${(Number(property.current_value) || 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Purchased at ${(Number(property.purchase_price) || 0).toLocaleString()}
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
                {((equity / (Number(property.current_value) || 1)) * 100).toFixed(1)}% of value
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
                ${monthlyRentIncome.toLocaleString()} rent - ${monthlyMortgage.toLocaleString()} mortgage
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
                ${tenants.reduce((sum, t) => sum + (Number(t.rent_amount) || 0), 0).toLocaleString()}/mo rent
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tenants">Tenants</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="financials">Financials</TabsTrigger>
          <TabsTrigger value="neighbors">Neighbors</TabsTrigger>
          <TabsTrigger value="codes">Codes</TabsTrigger>
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
                    <p className="font-medium">${(Number(property.purchase_price) || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Purchase Date</p>
                    <p className="font-medium">{property.purchase_date ? new Date(property.purchase_date).toLocaleDateString() : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Mortgage Balance</p>
                    <p className="font-medium">${(Number(property.mortgage_balance) || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Interest Rate</p>
                    <p className="font-medium">{property.mortgage_rate}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Monthly Payment</p>
                    <p className="font-medium">${(Number(property.mortgage_payment) || 0).toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {property.status === 'sold' ? (
              <Card className="border-amber-200 bg-amber-50">
                <CardHeader>
                  <CardTitle className="text-amber-800">Sale Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-amber-700">Sold Price</p>
                      <p className="font-medium text-amber-900">${(Number(property.sold_price) || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-amber-700">Sold Date</p>
                      <p className="font-medium text-amber-900">
                        {property.sold_date ? new Date(property.sold_date).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-amber-200">
                    <p className="text-sm text-amber-700">Profit/Loss</p>
                    {(() => {
                      const profit = (Number(property.sold_price) || 0) - (Number(property.purchase_price) || 0);
                      return (
                        <p className={`text-lg font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {profit >= 0 ? '+' : ''}${profit.toLocaleString()}
                        </p>
                      );
                    })()}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Rent Income</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Monthly Rent</p>
                      <p className="font-medium">${(Number(property.monthly_rent) || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Avg Nightly Rent (STR)</p>
                      <p className="font-medium">${(Number(property.avg_nightly_rent) || 0).toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
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
              {tenants.length > 0 ? (
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
                          ${(Number(tenant.rent_amount) || 0).toLocaleString()}/mo
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
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Users className="h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-medium">No tenants yet</h3>
                  <p className="text-sm text-muted-foreground">
                    Add your first tenant to track leases and rent
                  </p>
                </div>
              )}
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
              {maintenance.length > 0 ? (
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
                          ${(Number(record.cost) || 0).toLocaleString()}
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
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-medium">No maintenance records</h3>
                  <p className="text-sm text-muted-foreground">
                    Track repairs and scheduled maintenance here
                  </p>
                </div>
              )}
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
              {transactions.length > 0 ? (
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
                          {tx.type === 'income' ? '+' : '-'}${Number(tx.amount).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <DollarSign className="h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-medium">No transactions yet</h3>
                  <p className="text-sm text-muted-foreground">
                    Import transactions from your bank or add them manually
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="neighbors" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Neighbors</CardTitle>
                <CardDescription>Contact information for neighbors</CardDescription>
              </div>
              <Button size="sm" onClick={() => openNeighborDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Neighbor
              </Button>
            </CardHeader>
            <CardContent>
              {neighbors.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Relationship</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {neighbors.map((neighbor) => (
                      <TableRow key={neighbor.id}>
                        <TableCell className="font-medium">{neighbor.name}</TableCell>
                        <TableCell>{neighbor.address || '-'}</TableCell>
                        <TableCell>
                          <div className="text-sm space-y-1">
                            {neighbor.phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3 text-muted-foreground" />
                                {neighbor.phone}
                              </div>
                            )}
                            {neighbor.email && (
                              <div className="flex items-center gap-1">
                                <Mail className="h-3 w-3 text-muted-foreground" />
                                {neighbor.email}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{neighbor.relationship || '-'}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openNeighborDialog(neighbor)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteNeighbor(neighbor.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <MapPin className="h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-medium">No neighbors yet</h3>
                  <p className="text-sm text-muted-foreground">
                    Add neighbor contact information for emergencies and coordination
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="codes" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Codes & Keys</CardTitle>
                <CardDescription>Lock codes, passwords, and key holders</CardDescription>
              </div>
              <Button size="sm" onClick={() => openCodeDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Code
              </Button>
            </CardHeader>
            <CardContent>
              {codes.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Value/Code</TableHead>
                      <TableHead>Key Holder</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {codes.map((code) => (
                      <TableRow key={code.id}>
                        <TableCell className="font-medium">{code.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {codeTypeLabels[code.code_type] || code.code_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <code className="bg-muted px-2 py-1 rounded text-sm">
                            {code.value || '-'}
                          </code>
                        </TableCell>
                        <TableCell>
                          {code.holder_name ? (
                            <div className="text-sm">
                              <div>{code.holder_name}</div>
                              {code.holder_phone && (
                                <div className="text-muted-foreground">{code.holder_phone}</div>
                              )}
                            </div>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openCodeDialog(code)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteCode(code.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Key className="h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-medium">No codes or keys yet</h3>
                  <p className="text-sm text-muted-foreground">
                    Store lock codes, passwords, and key holder information
                  </p>
                </div>
              )}
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

      {/* Neighbor Dialog */}
      <Dialog open={neighborDialogOpen} onOpenChange={setNeighborDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingNeighbor ? 'Edit Neighbor' : 'Add Neighbor'}</DialogTitle>
            <DialogDescription>
              {editingNeighbor
                ? 'Update neighbor contact information'
                : 'Add a neighbor contact for this property'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="neighbor-name">Name *</Label>
              <Input
                id="neighbor-name"
                value={neighborForm.name}
                onChange={(e) => setNeighborForm({ ...neighborForm, name: e.target.value })}
                placeholder="John Smith"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="neighbor-address">Address</Label>
              <Input
                id="neighbor-address"
                value={neighborForm.address}
                onChange={(e) => setNeighborForm({ ...neighborForm, address: e.target.value })}
                placeholder="123 Next Door St"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="neighbor-phone">Phone</Label>
                <Input
                  id="neighbor-phone"
                  value={neighborForm.phone}
                  onChange={(e) => setNeighborForm({ ...neighborForm, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="neighbor-email">Email</Label>
                <Input
                  id="neighbor-email"
                  type="email"
                  value={neighborForm.email}
                  onChange={(e) => setNeighborForm({ ...neighborForm, email: e.target.value })}
                  placeholder="john@example.com"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="neighbor-relationship">Relationship</Label>
              <Input
                id="neighbor-relationship"
                value={neighborForm.relationship}
                onChange={(e) => setNeighborForm({ ...neighborForm, relationship: e.target.value })}
                placeholder="Next door neighbor, across the street, etc."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="neighbor-notes">Notes</Label>
              <Textarea
                id="neighbor-notes"
                value={neighborForm.notes}
                onChange={(e) => setNeighborForm({ ...neighborForm, notes: e.target.value })}
                placeholder="Additional notes about this neighbor"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNeighborDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveNeighbor} disabled={neighborSaving || !neighborForm.name}>
              {neighborSaving ? 'Saving...' : editingNeighbor ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Code Dialog */}
      <Dialog open={codeDialogOpen} onOpenChange={setCodeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCode ? 'Edit Code' : 'Add Code'}</DialogTitle>
            <DialogDescription>
              {editingCode
                ? 'Update code or key holder information'
                : 'Add a lock code, password, or key holder for this property'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="code-name">Name *</Label>
              <Input
                id="code-name"
                value={codeForm.name}
                onChange={(e) => setCodeForm({ ...codeForm, name: e.target.value })}
                placeholder="Front Door, Garage, Alarm, etc."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="code-type">Type</Label>
              <Select
                value={codeForm.code_type}
                onValueChange={(value) =>
                  setCodeForm({ ...codeForm, code_type: value as PropertyCode['code_type'] })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lock_code">Lock Code</SelectItem>
                  <SelectItem value="password">Password</SelectItem>
                  <SelectItem value="key_holder">Key Holder</SelectItem>
                  <SelectItem value="gate_code">Gate Code</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="code-value">Code/Value</Label>
              <Input
                id="code-value"
                value={codeForm.value}
                onChange={(e) => setCodeForm({ ...codeForm, value: e.target.value })}
                placeholder="1234, password123, etc."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="holder-name">Key Holder Name</Label>
                <Input
                  id="holder-name"
                  value={codeForm.holder_name}
                  onChange={(e) => setCodeForm({ ...codeForm, holder_name: e.target.value })}
                  placeholder="Jane Doe"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="holder-phone">Key Holder Phone</Label>
                <Input
                  id="holder-phone"
                  value={codeForm.holder_phone}
                  onChange={(e) => setCodeForm({ ...codeForm, holder_phone: e.target.value })}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="code-notes">Notes</Label>
              <Textarea
                id="code-notes"
                value={codeForm.notes}
                onChange={(e) => setCodeForm({ ...codeForm, notes: e.target.value })}
                placeholder="Additional notes"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCodeDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveCode} disabled={codeSaving || !codeForm.name}>
              {codeSaving ? 'Saving...' : editingCode ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
