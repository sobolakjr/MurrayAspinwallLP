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
import { Plus, Search, MoreHorizontal, Building2, Eye, Edit, Trash2 } from 'lucide-react';
import type { Property } from '@/types';

interface PropertiesClientProps {
  initialProperties: Property[];
}

function formatStatus(status: string): string {
  const statusLabels: Record<string, string> = {
    rented: 'Rented',
    listed_rent: 'Listed (Rent)',
    listed_sell: 'Listed (Sell)',
    reno_changeover: 'Reno/Changeover',
    listed_str: 'Listed (ST Rental)',
  };
  return statusLabels[status] || status;
}

export function PropertiesClient({ initialProperties }: PropertiesClientProps) {
  const [search, setSearch] = useState('');
  const properties = initialProperties.filter(
    (p) =>
      p.address.toLowerCase().includes(search.toLowerCase()) ||
      p.city.toLowerCase().includes(search.toLowerCase())
  );

  const portfolioValue = properties.reduce((sum, p) => sum + (Number(p.current_value) || 0), 0);
  const totalEquity = properties.reduce((sum, p) => sum + ((Number(p.current_value) || 0) - (Number(p.mortgage_balance) || 0)), 0);
  const monthlyMortgage = properties.reduce((sum, p) => sum + (Number(p.mortgage_payment) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Properties</h1>
          <p className="text-muted-foreground">
            Manage your rental property portfolio
          </p>
        </div>
        <Button asChild>
          <Link href="/properties/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Property
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{properties.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${portfolioValue.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Equity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalEquity.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Monthly Mortgage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${monthlyMortgage.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Properties Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Properties</CardTitle>
              <CardDescription>Click on a property to view details</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search properties..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {properties.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Address</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Beds/Baths</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead className="text-right">Equity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {properties.map((property) => (
                  <TableRow key={property.id}>
                    <TableCell>
                      <Link
                        href={`/properties/${property.id}`}
                        className="flex items-center gap-2 font-medium hover:underline"
                      >
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div>{property.address}</div>
                          <div className="text-sm text-muted-foreground">
                            {property.city}, {property.state} {property.zip}
                          </div>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell className="capitalize">
                      {property.property_type?.replace('_', ' ')}
                    </TableCell>
                    <TableCell>
                      {property.bedrooms}bd / {property.bathrooms}ba
                    </TableCell>
                    <TableCell className="text-right">
                      ${(Number(property.current_value) || 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      ${((Number(property.current_value) || 0) - (Number(property.mortgage_balance) || 0)).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={property.status === 'rented' ? 'default' : 'secondary'}
                      >
                        {formatStatus(property.status)}
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
                            <Link href={`/properties/${property.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/properties/${property.id}/edit`}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
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
              <Building2 className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium">No properties yet</h3>
              <p className="text-sm text-muted-foreground">
                Add your first property to get started
              </p>
              <Button className="mt-4" asChild>
                <Link href="/properties/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Property
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
