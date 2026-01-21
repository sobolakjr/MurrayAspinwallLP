'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Search, MoreHorizontal, Home, Eye, Calculator, Trash2, MessageSquare } from 'lucide-react';
import type { Prospect, ProspectStatus } from '@/types';

// Demo data
const demoProspects: Prospect[] = [
  {
    id: '1',
    mls_number: 'MLS-12345',
    address: '123 Main Street',
    city: 'Columbus',
    state: 'OH',
    zip: '43215',
    list_price: 185000,
    property_type: 'single_family',
    bedrooms: 3,
    bathrooms: 2,
    sqft: 1400,
    lot_size: 0.2,
    year_built: 1975,
    days_on_market: 15,
    status: 'researching',
    api_data: null,
    notes: 'Good starter property, needs some cosmetic updates.',
    created_at: '2024-01-10T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
  },
  {
    id: '2',
    mls_number: 'MLS-67890',
    address: '456 Oak Avenue',
    city: 'Dublin',
    state: 'OH',
    zip: '43017',
    list_price: 245000,
    property_type: 'single_family',
    bedrooms: 4,
    bathrooms: 2.5,
    sqft: 1850,
    lot_size: 0.3,
    year_built: 1995,
    days_on_market: 7,
    status: 'offer_made',
    api_data: null,
    notes: 'Great neighborhood, strong rental demand.',
    created_at: '2024-01-08T00:00:00Z',
    updated_at: '2024-01-14T00:00:00Z',
  },
  {
    id: '3',
    mls_number: 'MLS-11111',
    address: '789 Pine Road',
    city: 'Westerville',
    state: 'OH',
    zip: '43081',
    list_price: 199000,
    property_type: 'condo',
    bedrooms: 2,
    bathrooms: 2,
    sqft: 1100,
    lot_size: null,
    year_built: 2005,
    days_on_market: 30,
    status: 'passed',
    api_data: null,
    notes: 'HOA too high for cash flow.',
    created_at: '2024-01-05T00:00:00Z',
    updated_at: '2024-01-12T00:00:00Z',
  },
];

const statusColors: Record<ProspectStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  researching: 'secondary',
  offer_made: 'default',
  passed: 'outline',
  won: 'default',
  lost: 'destructive',
};

const statusLabels: Record<ProspectStatus, string> = {
  researching: 'Researching',
  offer_made: 'Offer Made',
  passed: 'Passed',
  won: 'Won',
  lost: 'Lost',
};

export default function ProspectsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const prospects = demoProspects.filter((p) => {
    const matchesSearch =
      p.address.toLowerCase().includes(search.toLowerCase()) ||
      p.city.toLowerCase().includes(search.toLowerCase()) ||
      p.mls_number?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeCount = demoProspects.filter((p) => p.status === 'researching' || p.status === 'offer_made').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Prospects</h1>
          <p className="text-muted-foreground">
            Track and analyze potential investment properties
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/prospects/search">
              <Search className="mr-2 h-4 w-4" />
              Search MLS
            </Link>
          </Button>
          <Button asChild>
            <Link href="/prospects/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Manually
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Prospects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{demoProspects.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Offers Made</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {demoProspects.filter((p) => p.status === 'offer_made').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg. List Price</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${Math.round(demoProspects.reduce((sum, p) => sum + (p.list_price || 0), 0) / demoProspects.length).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Prospects Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Prospects</CardTitle>
              <CardDescription>Properties you are evaluating</CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="researching">Researching</SelectItem>
                  <SelectItem value="offer_made">Offer Made</SelectItem>
                  <SelectItem value="passed">Passed</SelectItem>
                  <SelectItem value="won">Won</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search address or MLS#..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {prospects.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead>MLS #</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Beds/Baths</TableHead>
                  <TableHead className="text-right">List Price</TableHead>
                  <TableHead>DOM</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prospects.map((prospect) => (
                  <TableRow key={prospect.id}>
                    <TableCell>
                      <Link
                        href={`/prospects/${prospect.id}`}
                        className="flex items-center gap-2 font-medium hover:underline"
                      >
                        <Home className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div>{prospect.address}</div>
                          <div className="text-sm text-muted-foreground">
                            {prospect.city}, {prospect.state}
                          </div>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {prospect.mls_number}
                    </TableCell>
                    <TableCell className="capitalize">
                      {prospect.property_type?.replace('_', ' ')}
                    </TableCell>
                    <TableCell>
                      {prospect.bedrooms}bd / {prospect.bathrooms}ba
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${(prospect.list_price || 0).toLocaleString()}
                    </TableCell>
                    <TableCell>{prospect.days_on_market}</TableCell>
                    <TableCell>
                      <Badge variant={statusColors[prospect.status]}>
                        {statusLabels[prospect.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/prospects/${prospect.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/calculator?prospect=${prospect.id}`}>
                              <Calculator className="mr-2 h-4 w-4" />
                              Run Proforma
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/prospects/${prospect.id}/feedback`}>
                              <MessageSquare className="mr-2 h-4 w-4" />
                              Add Feedback
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Search className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium">No prospects found</h3>
              <p className="text-sm text-muted-foreground">
                {search || statusFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Start by searching for properties or adding one manually'}
              </p>
              <Button className="mt-4" asChild>
                <Link href="/prospects/search">
                  <Search className="mr-2 h-4 w-4" />
                  Search Properties
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
